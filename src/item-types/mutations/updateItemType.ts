import { resolver } from "@blitzjs/rpc"
import db from "db"
import { UpdateItemTypeSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateItemTypeSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const itemType = await db.itemType.update({ where: { id }, data })

    return itemType
  }
)
