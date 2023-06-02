import { resolver } from "@blitzjs/rpc"
import db from "db"
import { UpdateGroceryTripSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateGroceryTripSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const groceryTrip = await db.groceryTrip.update({ where: { id }, data })

    return groceryTrip
  }
)
