import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

// Seeds the ItemType shelf-life catalog from USDA FoodKeeper (CC0). The source
// JSON (prisma/seeds/foodkeeper.json) is a faithful, untransformed copy; the
// derivation lives here so it's reviewable and tunable. Location-agnostic for
// now: we collapse FoodKeeper's many timeframes into one representative
// lifespan and keep the full record in `raw` for Phase 3 to expand.

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

type Ingredient = Record<string, string>;
type Category = { id: number; name: string; subcategory: string };
type FoodKeeper = { categories: Category[]; ingredients: Ingredient[] };

// Metric → seconds. The data also uses the singular "Year" and non-numeric
// metrics ("When Ripe", "Not Recommended", "Package use-by date") which carry
// no duration and are skipped; "Indefinitely" is treated as a long shelf life.
const SECONDS: Record<string, number> = {
  Hours: 3600,
  Days: 86400,
  Weeks: 604800,
  Months: 2592000, // 30 days
  Years: 31536000, // 365 days
  Year: 31536000,
};
const INDEFINITELY = SECONDS.Years * 10;

// Storage timeframe groups, in priority order — first one with a usable
// duration wins. Refrigerator/pantry before freezer (the "fresh" lifespan).
const GROUPS: [min: string, max: string, metric: string][] = [
  ["Refrigerate_Min", "Refrigerate_Max", "Refrigerate_Metric"],
  ["Pantry_Min", "Pantry_Max", "Pantry_Metric"],
  ["DOP_Refrigerate_Min", "DOP_Refrigerate_Max", "DOP_Refrigerate_Metric"],
  ["DOP_Pantry_Min", "DOP_Pantry_Max", "DOP_Pantry_Metric"],
  ["Refrigerate_After_Opening_Min", "Refrigerate_After_Opening_Max", "Refrigerate_After_Opening_Metric"],
  ["Pantry_After_Opening_Min", "Pantry_After_Opening_Max", "Pantry_After_Opening_Metric"],
  ["Freeze_Min", "Freeze_Max", "Freeze_Metric"],
  ["DOP_Freeze_Min", "DOP_Freeze_Max", "DOP_Freeze_Metric"],
];

const TIP_KEYS = [
  "Refrigerate_tips",
  "Pantry_tips",
  "Freeze_Tips",
  "DOP_Refrigerate_tips",
  "DOP_Pantry_tips",
  "DOP_Freeze_Tips",
];

function lifeSpanSeconds(row: Ingredient): number {
  for (const [minKey, maxKey, metricKey] of GROUPS) {
    const metric = row[metricKey];
    if (!metric) continue;
    if (metric === "Indefinitely") return INDEFINITELY;
    const factor = SECONDS[metric];
    if (!factor) continue; // non-numeric metric (e.g. "When Ripe")
    const value = Number(row[maxKey] || row[minKey]);
    if (Number.isFinite(value) && value > 0) return Math.round(value * factor);
  }
  return 0; // unknown — Phase 3 / LLM fallback fills the gap
}

function storageAdvice(row: Ingredient): string {
  for (const key of TIP_KEYS) {
    if (row[key]) return row[key];
  }
  return "";
}

function main() {
  const data: FoodKeeper = JSON.parse(
    readFileSync(join(__dirname, "seeds", "foodkeeper.json"), "utf8")
  );
  const categoryById = new Map(data.categories.map((c) => [c.id, c.name]));

  // Names repeat across variants (e.g. several "Cheese" rows). Disambiguate
  // duplicates with the subtitle, then a counter, so each name stays unique.
  const nameCounts = new Map<string, number>();
  for (const r of data.ingredients)
    nameCounts.set(r.Name, (nameCounts.get(r.Name) ?? 0) + 1);

  const used = new Set<string>();
  const rows = data.ingredients
    .filter((r) => r.Name)
    .map((r) => {
      let base = r.Name;
      if ((nameCounts.get(r.Name) ?? 0) > 1 && r.Name_subtitle)
        base = `${r.Name} (${r.Name_subtitle})`;
      let name = base;
      for (let i = 2; used.has(name); i++) name = `${base} (${i})`;
      used.add(name);

      return {
        name,
        category: categoryById.get(Number(r.Category_ID)) ?? "Other",
        suggestedLifeSpanSeconds: lifeSpanSeconds(r),
        storageAdvice: storageAdvice(r),
        source: "FoodKeeper",
        raw: r,
      };
    });

  return prisma.$transaction(async (tx) => {
    await tx.itemType.deleteMany({ where: { source: "FoodKeeper" } });
    await tx.itemType.createMany({ data: rows });
    return rows.length;
  });
}

main()
  .then((n) => console.log(`Seeded ${n} FoodKeeper ItemTypes`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
