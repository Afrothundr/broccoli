import dayjs from "dayjs"
import db from "./index"
import duration from "dayjs/plugin/duration"

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
]

const groceryTrips = [
  {
    name: "Sample Grocery Trip",
  },
]
const seed = async () => {
  // for (let i = 0; i < 5; i++) {
  //   await db.project.create({ data: { name: "Project " + i } })
  // }
  itemTypes.forEach(async (itemType) => {
    await db.itemType.create({ data: { ...itemType } })
  })

  groceryTrips.forEach(async (groceryTrip) => {
    await db.groceryTrip.create({
      data: {
        ...groceryTrip,
        user: {
          connect: { id: 2 },
        },
      },
    })
  })
}

export default seed
