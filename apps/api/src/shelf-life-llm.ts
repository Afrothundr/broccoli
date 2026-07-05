import { prisma } from "./db";

// LLM fallback for expiration advice (PRD §5 Pillar 3): items whose category
// didn't match the curated catalog get a Gemini estimate, stored with source
// LLM so the app flags it as an AI estimate. Runs fire-and-forget after
// receipt.confirm — a save never waits on (or fails because of) the model.
//
// Called direct via Gemini's REST API with native fetch: no SDK dependency,
// and no hop through broccoli-model (that service is receipt-parsing-shaped;
// coupling deploys over one prompt isn't worth it). Uses the same AI_KEY
// naming as broccoli-model. Without the key this is a logged no-op, so the
// api stays deployable everywhere.

const MODEL = "gemini-2.5-flash";

type Estimate = { days: number; storage: "PANTRY" | "FRIDGE" | "FREEZER" };

// Gemini structured-output schema (their OpenAPI-ish dialect): one estimate
// per input item, in order.
const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      days: { type: "INTEGER", description: "Typical shelf life in days from purchase" },
      storage: { type: "STRING", enum: ["PANTRY", "FRIDGE", "FREEZER"] },
    },
    required: ["days", "storage"],
  },
} as const;

async function requestEstimates(names: string[]): Promise<Estimate[] | null> {
  const key = process.env.AI_KEY;
  if (!key) {
    console.warn("shelf-life LLM fallback skipped: AI_KEY not configured");
    return null;
  }

  const prompt = `These are grocery receipt line items. For each, estimate the typical shelf life in days from purchase for a home kitchen, and where it is usually stored. Be conservative: when unsure between two numbers, pick the smaller. Return one entry per item, in the same order.

Items:
${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);

  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  return JSON.parse(text) as Estimate[];
}

// Estimate expirations for a receipt's still-unestimated items. Guarded so a
// concurrent user adjustment always wins: the update only applies while
// expirationSource is still null.
export async function backfillExpirations(receiptId: string, purchasedAt: Date) {
  try {
    const items = await prisma.item.findMany({
      where: { receiptId, expirationSource: null, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });
    if (!items.length) return;

    const estimates = await requestEstimates(items.map((i) => i.name));
    if (!estimates) return;

    await Promise.all(
      items.map((item, index) => {
        const estimate = estimates[index];
        if (!estimate || !Number.isFinite(estimate.days) || estimate.days <= 0) return null;
        return prisma.item.updateMany({
          where: { id: item.id, expirationSource: null },
          data: {
            expiresAt: new Date(purchasedAt.getTime() + estimate.days * 86_400_000),
            storageLocation: estimate.storage,
            expirationSource: "LLM",
          },
        });
      })
    );
  } catch (err) {
    // Estimates are advice, not data integrity — items simply stay
    // estimate-less until the user sets a date or location.
    console.error(`shelf-life LLM fallback failed for receipt ${receiptId}:`, err);
  }
}
