import { resolver } from "@blitzjs/rpc"
import db from "db"
import { DeleteGroceryTripSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteGroceryTripSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const groceryTrip = await db.groceryTrip.deleteMany({ where: { id } })

    return groceryTrip
  }
)
