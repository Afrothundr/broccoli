import { resolver } from "@blitzjs/rpc"
import db from "db"
import { DeleteItemTypeSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteItemTypeSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const itemType = await db.itemType.deleteMany({ where: { id } })

    return itemType
  }
)
