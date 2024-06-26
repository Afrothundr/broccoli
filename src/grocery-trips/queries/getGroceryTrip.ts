import { resolver } from "@blitzjs/rpc"
import { NotFoundError } from "blitz"
import db from "db"
import { z } from "zod"

const GetGroceryTrip = z.object({
  // This accepts type of undefined, but is required at runtime
  id: z.number().optional().refine(Boolean, "Required"),
})

export default resolver.pipe(resolver.zod(GetGroceryTrip), resolver.authorize(), async ({ id }) => {
  // TODO: in multi-tenant app, you must add validation to ensure correct tenant
  const groceryTrip = await db.groceryTrip.findFirst({
    where: { id },
    include: {
      items: {
        include: {
          itemTypes: true,
        },
      },
      receipts: true,
    },
  })

  if (!groceryTrip) throw new NotFoundError()

  return groceryTrip
})
