import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateReceiptSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateReceiptSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const receipt = await db.receipt.create({ data: input })

    return receipt
  }
)
