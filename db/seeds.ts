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
    storage_advice: "Store at room temperature, away from direct sunlight.",
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
  // for (let i = 0; i < 5; i++) {
  //   await db.project.create({ data: { name: "Project " + i } })
  // }
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
