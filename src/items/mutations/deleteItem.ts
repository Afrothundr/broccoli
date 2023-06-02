import { resolver } from "@blitzjs/rpc"
import db from "db"
import { DeleteItemSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteItemSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const item = await db.item.deleteMany({ where: { id } })

    return item
  }
)
