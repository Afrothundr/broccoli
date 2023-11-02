import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateBulkReceiptSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateBulkReceiptSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const receipt = await db.receipt.createMany({ data: input })

    return receipt
  }
)
