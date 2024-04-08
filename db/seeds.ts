import { SecurePassword } from "@blitzjs/auth/secure-password"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import db from "./index"

/*
 * This seed function is executed when you run `blitz db seed`.
 *
 * Probably you want to use a library like https://chancejs.com
 * to easily generate realistic data.
 */
dayjs.extend(duration)
const itemTypes = [
  {
    name: "Broccoli",
    storage_advice: 'Store loosely wrapped in a refrigerator crisper drawer set to "High-Humidity"',
    suggested_life_span_seconds: dayjs.duration({ weeks: 1 }).asSeconds(),
    category: "Vegetables",
  },
  {
    name: "Brussels sprouts",
    storage_advice: 'Store loosely wrapped in a refrigerator crisper drawer set to "High-Humidity"',
    suggested_life_span_seconds: dayjs.duration({ weeks: 1 }).asSeconds(),
    category: "Vegetables",
  },
  {
    name: "Citrus",
    storage_advice: "Store in a refrigerator at 41°F to 42°F",
    suggested_life_span_seconds: dayjs.duration({ weeks: 2, days: 3 }).asSeconds(),
    category: "Fruit",
  },
  {
    name: "Self Destructing Spinach",
    storage_advice: "Good luck",
    suggested_life_span_seconds: dayjs.duration({ minutes: 1 }).asSeconds(),
    category: "Test",
  },
  {
    name: "Apples",
    storage_advice: "Store in a cool, dark place or in the refrigerator.",
    suggested_life_span_seconds: dayjs.duration({ days: 14 }).asSeconds(),
    category: "Fruit",
  },
  {
    name: "Bananas",
    storage_advice:
      "Store at room temperature, away from direct sunlight. Plastic around the end of the bunch will slow the ripening process",
    suggested_life_span_seconds: dayjs.duration({ days: 7 }).asSeconds(),
    category: "Fruit",
  },
  {
    name: "Carrots",
    storage_advice: "Store in a cool, dry place or in the refrigerator.",
    suggested_life_span_seconds: dayjs.duration({ days: 14 }).asSeconds(),
    category: "Vegetables",
  },
  {
    name: "Spinach",
    storage_advice: "Store in the refrigerator in a plastic bag.",
    suggested_life_span_seconds: dayjs.duration({ days: 7 }).asSeconds(),
    category: "Vegetables",
  },
  {
    name: "Milk",
    storage_advice: "Refrigerate at all times.",
    suggested_life_span_seconds: dayjs.duration({ days: 7 }).asSeconds(),
    category: "Dairy",
  },
  {
    name: "Cheese",
    storage_advice: "Store in the refrigerator in an airtight container.",
    suggested_life_span_seconds: dayjs.duration({ days: 14 }).asSeconds(),
    category: "Dairy",
  },
  {
    name: "Eggs",
    storage_advice: "Keep in their original carton in the refrigerator.",
    suggested_life_span_seconds: dayjs.duration({ days: 21 }).asSeconds(),
    category: "Eggs",
  },
  {
    name: "Avocado",
    storage_advice: "Store at room temperature until ripe, then transfer to the refrigerator.",
    suggested_life_span_seconds: 259200,
    category: "Fruit",
  },
  {
    name: "Kiwi",
    storage_advice: "Store at room temperature until ripe, then transfer to the refrigerator.",
    suggested_life_span_seconds: 259200,
    category: "Fruit",
  },
  {
    name: "Lemon",
    storage_advice: "Store at room temperature or in the refrigerator.",
    suggested_life_span_seconds: 1209600,
    category: "Fruit",
  },
  {
    name: "Lime",
    storage_advice: "Store at room temperature or in the refrigerator.",
    suggested_life_span_seconds: 1209600,
    category: "Fruit",
  },
  {
    name: "Mango",
    storage_advice: "Store at room temperature until ripe, then transfer to the refrigerator.",
    suggested_life_span_seconds: 259200,
    category: "Fruit",
  },
  {
    name: "Nectarine",
    storage_advice: "Store at room temperature until ripe, then transfer to the refrigerator.",
    suggested_life_span_seconds: 259200,
    category: "Fruit",
  },
  {
    name: "Orange",
    storage_advice: "Store at room temperature or in the refrigerator.",
    suggested_life_span_seconds: 1209600,
    category: "Fruit",
  },
  {
    name: "Papaya",
    storage_advice: "Store at room temperature until ripe, then transfer to the refrigerator.",
    suggested_life_span_seconds: 259200,
    category: "Fruit",
  },
  {
    name: "Passion Fruit",
    storage_advice: "Store at room temperature until ripe, then transfer to the refrigerator.",
    suggested_life_span_seconds: 604800,
    category: "Fruit",
  },
  {
    name: "Peach",
    storage_advice: "Store at room temperature until ripe, then transfer to the refrigerator.",
    suggested_life_span_seconds: 259200,
    category: "Fruit",
  },
  {
    name: "Pineapple",
    storage_advice: "Store at room temperature until ripe, then transfer to the refrigerator.",
    suggested_life_span_seconds: 259200,
    category: "Fruit",
  },
  {
    name: "Plum",
    storage_advice: "Store at room temperature until ripe, then transfer to the refrigerator.",
    suggested_life_span_seconds: 259200,
    category: "Fruit",
  },
  {
    name: "Pomegranate",
    storage_advice: "Store at room temperature.",
    suggested_life_span_seconds: 1209600,
    category: "Fruit",
  },
  {
    name: "Grapefruit",
    storage_advice: "Store at room temperature or in the refrigerator.",
    suggested_life_span_seconds: 1209600,
    category: "Fruit",
  },
  {
    name: "Oat Milk",
    storage_advice: "Store in the refrigerator.",
    suggested_life_span_seconds: 604800,
    category: "Non-Dairy Milk",
  },
  {
    name: "Asparagus",
    storage_advice: "Store in the refrigerator.",
    suggested_life_span_seconds: 345600,
    category: "Vegetables",
  },
  {
    name: "Cabbage",
    storage_advice: "Store in the refrigerator.",
    suggested_life_span_seconds: 864000,
    category: "Vegetables",
  },
  {
    name: "Carrots",
    storage_advice: "Store in the refrigerator.",
    suggested_life_span_seconds: 604800,
    category: "Vegetables",
  },
  {
    name: "Cucumber",
    storage_advice: "Store in the refrigerator.",
    suggested_life_span_seconds: 432000,
    category: "Vegetables",
  },
  {
    name: "Garlic",
    storage_advice: "Store in a cool, dry place away from direct sunlight.",
    suggested_life_span_seconds: 604800,
    category: "Vegetables",
  },
  {
    name: "Ginger",
    storage_advice: "Store in a cool, dry place away from direct sunlight.",
    suggested_life_span_seconds: 1209600,
    category: "Vegetables",
  },
  {
    name: "Leek",
    storage_advice: "Store in the refrigerator.",
    suggested_life_span_seconds: 604800,
    category: "Vegetables",
  },
  {
    name: "Mushroom",
    storage_advice: "Store in the refrigerator.",
    suggested_life_span_seconds: 345600,
    category: "Vegetables",
  },
  {
    name: "Onion",
    storage_advice: "Store in a cool, dry place away from direct sunlight.",
    suggested_life_span_seconds: 1209600,
    category: "Vegetables",
  },
  {
    name: "Beet",
    storage_advice: "Store in the refrigerator.",
    suggested_life_span_seconds: 864000,
    category: "Vegetables",
  },
  {
    name: "Zucchini",
    storage_advice: "Store in the refrigerator.",
    suggested_life_span_seconds: 432000,
    category: "Vegetables",
  },
]

const groceryTrips = [
  {
    name: "Sample Grocery Trip",
  },
]

const users = [
  {
    firstName: "Branford",
    lastName: "Harris",
    email: "afrothundr55@gmail.com",
    password: "&9S#3rAkr7%X%hT",
  },
]
const seed = async () => {
  users.forEach(async (user, index) => {
    const hashedPassword = await SecurePassword.hash(user.password.trim())
    const hashedUser = {
      ...user,
      password: undefined,
      hashedPassword,
    }
    await db.user.upsert({
      where: { email: user.email },
      update: { ...hashedUser },
      create: { ...hashedUser },
    })

    groceryTrips.forEach(async (groceryTrip) => {
      const userId = index + 1
      await db.groceryTrip.upsert({
        where: { id: userId },
        update: {
          ...groceryTrip,
          user: {
            connect: { id: userId },
          },
        },
        create: {
          ...groceryTrip,
          user: {
            connect: { id: userId },
          },
        },
      })
    })
  })

  itemTypes.forEach(async (itemType) => {
    await db.itemType.upsert({
      where: { name: itemType.name },
      update: { ...itemType },
      create: { ...itemType },
    })
  })
}

export default seed
