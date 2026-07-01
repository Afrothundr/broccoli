import { prisma } from "./db";

// Client for broccoli-model, the Python (FastAPI) receipt parser. It's stateless
// (see broccoli-model 2r8.4): we hand it the image URL plus the current ItemType
// catalog, and it returns structured line items with each `category` already
// fuzzy-snapped to one of our ItemType names (or a broad category / "Unknown").
//
// broccoli-api owns the DB and the Receipt row; the model just parses. We call
// this fire-and-forget from `receipt.create` and write the result back.

const MODEL_URL = process.env.BROCCOLI_MODEL_URL ?? "http://localhost:8000";
const MODEL_API_KEY = process.env.BROCCOLI_MODEL_API_KEY ?? "";

// One parsed line item as returned by broccoli-model. `price` is a raw string
// like "$12.98"; `category` is a snapped ItemType name (or "Unknown").
export type ScrapedItem = {
  name: string;
  price: string;
  category: string;
};

// The `data` payload broccoli-model returns from /ocr. All fields are
// best-effort — a noisy receipt may yield an empty item list or a blank store.
export type OcrData = {
  store?: string;
  date?: string;
  items?: ScrapedItem[];
};

// POST the receipt image to broccoli-model /ocr and return its parsed data.
// Throws on a non-2xx response so the caller can mark the Receipt as ERROR.
export async function requestOcr(imageUrl: string): Promise<OcrData> {
  // The model prompts Gemini with the full ItemType catalog so it snaps each
  // line to a known name. Passing it per-request keeps the model stateless.
  const itemTypes = await prisma.itemType.findMany({
    select: { name: true, category: true },
  });

  const res = await fetch(`${MODEL_URL}/ocr`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": MODEL_API_KEY,
    },
    body: JSON.stringify({ url: imageUrl, itemTypes }),
  });

  if (!res.ok) {
    throw new Error(`broccoli-model /ocr failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { data?: OcrData };
  return json.data ?? {};
}
