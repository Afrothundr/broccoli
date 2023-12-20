import { resolver } from "@blitzjs/rpc"
import dayjs from "dayjs"
import db from "db"
import { CreateItemSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateItemSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const item = await db.item.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        quantity: input.quantity,
        unit: input.unit,
        importId: input.importId,
        user: {
          connect: { id: input.userId },
        },
        itemTypes: {
          connect: input.itemTypes.map((id) => ({ id: parseInt(id) })),
        },
        groceryTrip: {
          connectOrCreate: {
            where: {
              id: parseInt(input.groceryTripId),
            },
            create: {
              name: "New Grocery Trip",
              user: {
                connect: { id: input.userId },
              },
            },
          },
        },
        reminders: {
          create: {
            time: dayjs().add(Number(input.reminderSpanSeconds), "seconds").format(),
            user: {
              connect: { id: input.userId },
            },
          },
        },
      },
    })

    return item
  }
)
