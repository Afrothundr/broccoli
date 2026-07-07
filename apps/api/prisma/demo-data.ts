import { PrismaClient, type ItemStatus, type StorageLocation, type ExpirationSource } from "@prisma/client";

// Demo data for local development: seeds one user's account with ~7 weeks of
// grocery history so every surface of the app has something to show — the
// savings hero, weekly used/wasted chart, category rollup, kitchen list with
// every freshness state (fresh, use-soon, overdue, EXPIRED), and a check-in
// deck with eaten/tossed history behind it.
//
//   pnpm --filter broccoli-api db:demo                 # seeds newuser@example.com
//   pnpm --filter broccoli-api db:demo you@email.com   # seeds another account
//
// Idempotent: demo receipts are tagged imageKey "demo-*" and wiped (cascading
// to their items) before re-inserting, so re-runs never duplicate. Real
// receipts (captured through the app) are untouched.

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY_MS);

type DemoItem = {
  name: string; // receipt-style display name
  typeName?: string; // exact ItemType catalog name to link (omit = parser miss)
  category?: string; // fallback category when unlinked
  price: number;
  status?: ItemStatus; // default ACTIVE
  storage?: StorageLocation;
  expiresIn?: number; // days from now (negative = overdue); omit = no estimate
  resolvedDaysAgo?: number; // for EATEN/TOSSED
  source?: ExpirationSource; // default FOODKEEPER when expiresIn is set
};

type DemoReceipt = {
  store: string;
  purchasedDaysAgo: number;
  items: DemoItem[];
};

// Statuses are tuned so the dashboard tells the intended story: waste well
// under the 1/3 baseline (green badge), green-dominant weekly bars with some
// red, and a kitchen where a handful of items genuinely need attention.
const RECEIPTS: DemoReceipt[] = [
  {
    store: "Whole Foods Market",
    purchasedDaysAgo: 45,
    items: [
      { name: "Whole Milk", typeName: "Milk (plain or flavored)", price: 4.29, status: "EATEN", resolvedDaysAgo: 39 },
      { name: "Eggs, dozen", typeName: "Eggs (in shell)", price: 5.49, status: "EATEN", resolvedDaysAgo: 33 },
      { name: "Sourdough Loaf", typeName: "Bread", price: 4.99, status: "EATEN", resolvedDaysAgo: 40 },
      { name: "Baby Spinach", typeName: "Lettuce (leaf, spinach)", price: 3.99, status: "TOSSED", resolvedDaysAgo: 38 },
      { name: "Bananas", typeName: "Bananas", price: 1.89, status: "EATEN", resolvedDaysAgo: 41 },
      { name: "Chicken Breast", typeName: "Chicken parts (breast halves, boneless)", price: 9.87, status: "EATEN", resolvedDaysAgo: 42 },
    ],
  },
  {
    store: "Trader Joe's",
    purchasedDaysAgo: 38,
    items: [
      { name: "Greek Yogurt", typeName: "Yogurt", price: 5.29, status: "EATEN", resolvedDaysAgo: 31 },
      { name: "Blueberries", typeName: "Blueberries", price: 3.99, status: "EATEN", resolvedDaysAgo: 34 },
      { name: "Cheddar Block", typeName: "Cheese (hard such as cheddar, swiss, block parmesan)", price: 6.49, status: "EATEN", resolvedDaysAgo: 20 },
      { name: "Ground Coffee", typeName: "Coffee (commercial ground, non-vacuum)", price: 8.99, status: "EATEN", resolvedDaysAgo: 12 },
      { name: "Avocados, 4 pack", typeName: "Avocados", price: 5.49, status: "TOSSED", resolvedDaysAgo: 32 },
      { name: "Gold Potatoes", typeName: "Potatoes", price: 3.49, status: "EATEN", resolvedDaysAgo: 25 },
    ],
  },
  {
    store: "Safeway",
    purchasedDaysAgo: 31,
    items: [
      { name: "2% Milk", typeName: "Milk (plain or flavored)", price: 3.99, status: "EATEN", resolvedDaysAgo: 24 },
      { name: "Strawberries", typeName: "Strawberries", price: 4.49, status: "TOSSED", resolvedDaysAgo: 26 },
      { name: "Salmon Fillet", category: "Fish", price: 12.99, status: "EATEN", resolvedDaysAgo: 27 },
      { name: "Honeycrisp Apples", typeName: "Apples", price: 5.99, status: "EATEN", resolvedDaysAgo: 15 },
      { name: "Rotisserie Chicken", typeName: "Chicken (whole)", price: 7.99, status: "EATEN", resolvedDaysAgo: 29 },
      { name: "Vanilla Ice Cream", typeName: "Ice cream", price: 5.49, status: "EATEN", resolvedDaysAgo: 18 },
    ],
  },
  {
    store: "Costco",
    purchasedDaysAgo: 24,
    items: [
      { name: "Eggs, 24 count", typeName: "Eggs (in shell)", price: 8.99, status: "EATEN", resolvedDaysAgo: 10 },
      { name: "Butter, 4 pack", typeName: "Butter", price: 11.99, storage: "FRIDGE", expiresIn: 35 },
      { name: "Ground Turkey", typeName: "Ground turkey or chicken", price: 13.49, status: "EATEN", resolvedDaysAgo: 21 },
      { name: "Red Grapes", typeName: "Grapes", price: 6.99, status: "EATEN", resolvedDaysAgo: 17 },
      { name: "Peanut Butter", typeName: "Peanut butter (commercial)", price: 9.49, storage: "PANTRY", expiresIn: 90 },
      { name: "Frozen Fries", typeName: "Frozen potato products", price: 7.99, storage: "FREEZER", expiresIn: 200 },
      { name: "Orange Juice", typeName: "Orange juice (commercially packaged carton)", price: 4.99, status: "TOSSED", resolvedDaysAgo: 9 },
    ],
  },
  {
    store: "Trader Joe's",
    purchasedDaysAgo: 17,
    items: [
      { name: "Whole Milk", typeName: "Milk (plain or flavored)", price: 4.29, status: "EATEN", resolvedDaysAgo: 8 },
      { name: "Hummus", typeName: "Hummus (commercial (pasteurized, with preservatives))", price: 3.99, storage: "FRIDGE", expiresIn: -1 },
      { name: "Baby Carrots", typeName: "Baby carrots", price: 2.49, storage: "FRIDGE", expiresIn: 6 },
      { name: "Multigrain Bread", typeName: "Bread", price: 3.99, status: "EATEN", resolvedDaysAgo: 11 },
      { name: "Bananas", typeName: "Bananas", price: 1.79, status: "EATEN", resolvedDaysAgo: 13 },
      { name: "Honey Nut Cereal", typeName: "Cereal (ready-to-eat)", price: 4.49, storage: "PANTRY", expiresIn: 120 },
    ],
  },
  {
    store: "Farmers Market",
    purchasedDaysAgo: 10,
    items: [
      { name: "Heirloom Tomatoes", typeName: "Tomatoes", price: 6.5, storage: "PANTRY", expiresIn: 1 },
      { name: "Leaf Lettuce", typeName: "Lettuce (iceberg, romaine)", price: 3.5, status: "EXPIRED", storage: "FRIDGE", expiresIn: -2 },
      { name: "Local Honey", typeName: "Honey", price: 9.0, storage: "PANTRY", expiresIn: 300 },
      { name: "Strawberries", typeName: "Strawberries", price: 5.0, status: "EATEN", resolvedDaysAgo: 6 },
      { name: "Yellow Onions", typeName: "Onions (yellow, white, red, etc.)", price: 2.75, storage: "PANTRY", expiresIn: 25 },
    ],
  },
  {
    store: "Whole Foods Market",
    purchasedDaysAgo: 4,
    items: [
      { name: "Greek Yogurt", typeName: "Yogurt", price: 5.49, storage: "FRIDGE", expiresIn: 9 },
      { name: "Chicken Thighs", typeName: "Chicken parts (legs or thighs)", price: 8.79, storage: "FRIDGE", expiresIn: 1, source: "LLM" },
      { name: "2% Milk", typeName: "Milk (plain or flavored)", price: 4.19, storage: "FRIDGE", expiresIn: 8 },
      { name: "Blueberries", typeName: "Blueberries", price: 4.29, storage: "FRIDGE", expiresIn: 4 },
      { name: "Sourdough Loaf", typeName: "Bread", price: 5.29, storage: "PANTRY", expiresIn: 2 },
      { name: "Avocados, 4 pack", typeName: "Avocados", price: 4.99, storage: "PANTRY", expiresIn: 3 },
      { name: "Cheddar Block", typeName: "Cheese (hard such as cheddar, swiss, block parmesan)", price: 7.29, storage: "FRIDGE", expiresIn: 30, source: "USER" },
      { name: "Eggs, dozen", typeName: "Eggs (in shell)", price: 5.99, storage: "FRIDGE", expiresIn: 20 },
    ],
  },
  {
    store: "Safeway",
    purchasedDaysAgo: 1,
    items: [
      { name: "Baby Spinach", typeName: "Lettuce (leaf, spinach)", price: 3.49, storage: "FRIDGE", expiresIn: 5 },
      { name: "Ground Beef", category: "Meat", price: 6.99, storage: "FRIDGE", expiresIn: 1 },
      { name: "Bananas", typeName: "Bananas", price: 1.99, storage: "PANTRY", expiresIn: 2 },
      { name: "Tortilla Chips", typeName: "Potato chips", price: 3.99, storage: "PANTRY", expiresIn: 60 },
    ],
  },
];

async function main() {
  const email = process.argv[2] ?? "newuser@example.com";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(
      `No user with email ${email}. Sign up in the app first, then re-run: pnpm db:demo ${email}`
    );
  }

  // Link items to the real FoodKeeper catalog so category rollups use the
  // broad catalog groups. Missing names degrade to unlinked items (a warning,
  // not an error) — the app treats those as parser misses, which is realistic.
  const typeNames = [...new Set(RECEIPTS.flatMap((r) => r.items.flatMap((i) => (i.typeName ? [i.typeName] : []))))];
  const types = await prisma.itemType.findMany({ where: { name: { in: typeNames } } });
  const typeByName = new Map(types.map((t) => [t.name, t]));
  for (const name of typeNames) {
    if (!typeByName.has(name)) console.warn(`ItemType not found (item stays unlinked): ${name}`);
  }

  const wiped = await prisma.receipt.deleteMany({
    where: { userId: user.id, imageKey: { startsWith: "demo-" } },
  });

  let itemCount = 0;
  for (const [index, receipt] of RECEIPTS.entries()) {
    const purchasedAt = new Date(daysAgo(receipt.purchasedDaysAgo).setHours(10, 30, 0, 0));
    const total = Math.round(receipt.items.reduce((sum, i) => sum + i.price, 0) * 100) / 100;

    await prisma.receipt.create({
      data: {
        userId: user.id,
        status: "SAVED",
        storeName: receipt.store,
        purchasedAt,
        total,
        imageUrl: `https://utfs.io/f/demo-receipt-${index + 1}`,
        imageKey: `demo-receipt-${index + 1}`,
        createdAt: purchasedAt,
        items: {
          create: receipt.items.map((item) => {
            const type = item.typeName ? typeByName.get(item.typeName) : undefined;
            const status = item.status ?? "ACTIVE";
            return {
              userId: user.id,
              name: item.name,
              price: item.price,
              category: type?.name ?? item.category ?? null,
              itemTypeId: type?.id ?? null,
              status,
              storageLocation: item.storage ?? null,
              expiresAt: item.expiresIn != null ? daysFromNow(item.expiresIn) : null,
              expirationSource: item.expiresIn != null ? (item.source ?? "FOODKEEPER") : null,
              resolvedAt: item.resolvedDaysAgo != null ? daysAgo(item.resolvedDaysAgo) : null,
              createdAt: purchasedAt,
            };
          }),
        },
      },
    });
    itemCount += receipt.items.length;
  }

  console.log(
    `Demo data for ${email}: wiped ${wiped.count} old demo receipts, created ${RECEIPTS.length} receipts / ${itemCount} items.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
