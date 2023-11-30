import { resolver } from "@blitzjs/rpc"
import db from "db"
import { UpdatePercentageSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdatePercentageSchema),
  resolver.authorize(),
  async ({ ids, percentConsumed }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const item = await db.item.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        percentConsumed,
      },
    })

    return item
  }
)
