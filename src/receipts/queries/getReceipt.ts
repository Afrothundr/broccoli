import { resolver } from "@blitzjs/rpc"
import { NotFoundError } from "blitz"
import db from "db"
import { z } from "zod"

const GetReceipt = z.object({
  // This accepts type of undefined, but is required at runtime
  id: z.number().optional().refine(Boolean, "Required"),
})

export default resolver.pipe(resolver.zod(GetReceipt), resolver.authorize(), async ({ id }) => {
  // TODO: in multi-tenant app, you must add validation to ensure correct tenant
  const receipt = await db.receipt.findFirst({
    where: { id },
    include: {
      items: {
        include: {
          itemTypes: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!receipt) throw new NotFoundError()

  return receipt
})
