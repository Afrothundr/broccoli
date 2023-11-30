import { resolver } from "@blitzjs/rpc"
import db from "db"
import { UpdateStatusSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateStatusSchema),
  resolver.authorize(),
  async ({ ids, status }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const item = await db.item.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        status,
      },
    })

    return item
  }
)
