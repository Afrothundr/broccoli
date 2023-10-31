import { resolver } from "@blitzjs/rpc"
import db, { ItemType } from "db"
import { CreateItemTypeSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateItemTypeSchema),
  resolver.authorize(),
  async (input: ItemType) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const itemType = await db.itemType.create({ data: input })

    return itemType
  }
)
