import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateItemSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateItemSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const item = await db.item.create({ data: input })

    return item
  }
)
