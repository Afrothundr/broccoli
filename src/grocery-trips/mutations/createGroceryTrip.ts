import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateGroceryTripSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateGroceryTripSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const groceryTrip = await db.groceryTrip.create({ data: input })

    return groceryTrip
  }
)
