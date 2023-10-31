import { resolver } from "@blitzjs/rpc"
import db from "db"
import { DeleteReceiptSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteReceiptSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const receipt = await db.receipt.deleteMany({ where: { id } })

    return receipt
  }
)
