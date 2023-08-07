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
  },
  {
    name: "Brussels sprouts",
    storage_advice: 'Store loosely wrapped in a refrigerator crisper drawer set to "High-Humidity"',
    suggested_life_span_seconds: dayjs.duration({ weeks: 1 }).asSeconds(),
  },
  {
    name: "Citrus",
    storage_advice: "Store in a refrigerator at 41°F to 42°F",
    suggested_life_span_seconds: dayjs.duration({ weeks: 2, days: 3 }).asSeconds(),
  },
  {
    name: "Self Destructing Spinach",
    storage_advice: "Good luck",
    suggested_life_span_seconds: dayjs.duration({ minutes: 1 }).asSeconds(),
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
      await db.groceryTrip.create({
        data: {
          ...groceryTrip,
          user: {
            connect: { id: index + 1 },
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
