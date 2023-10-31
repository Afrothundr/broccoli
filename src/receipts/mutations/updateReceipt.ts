import { resolver } from "@blitzjs/rpc"
import db from "db"
import { UpdateReceiptSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateReceiptSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const receipt = await db.receipt.update({ where: { id }, data })

    return receipt
  }
)
