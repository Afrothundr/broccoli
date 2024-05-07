import { SecurePassword } from "@blitzjs/auth/secure-password"
import db from "./index"
import { ITEM_TYPES } from "./item_types"

/*
 * This seed function is executed when you run `blitz db seed`.
 *
 * Probably you want to use a library like https://chancejs.com
 * to easily generate realistic data.
 */

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

  Object.values(ITEM_TYPES).forEach(
    async (itemType: {
      name: string
      storage_advice: string
      suggested_life_span_seconds: number
      category: string
    }) => {
      await db.itemType.upsert({
        where: { name: itemType.name },
        update: { ...itemType },
        create: { ...itemType },
      })
    }
  )
}

export default seed
