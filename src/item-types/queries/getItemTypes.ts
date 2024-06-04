import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"

interface GetItemTypesInput
  extends Pick<Prisma.ItemTypeFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy }: GetItemTypesInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const itemTypes = await db.itemType.findMany({
      where,
      orderBy,
      include: { items: { include: { groceryTrip: { include: { user: true } } } } },
    })

    return {
      itemTypes,
    }
  }
)
