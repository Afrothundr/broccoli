import { resolver } from "@blitzjs/rpc"
import db from "db"
import { UpdateItemSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateItemSchema),
  resolver.authorize(),
  async ({ id, groceryTripId, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const item = await db.item.update({
      where: { id },
      data: {
        ...data,
        itemTypes: {
          connect: data.itemTypes.map((id) => ({ id: parseInt(id) })),
        },
        groceryTrip: {
          connect: {
            id: parseInt(groceryTripId),
          },
        },
      },
    })

    return item
  }
)
