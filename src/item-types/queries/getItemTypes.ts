import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"

interface GetItemTypesInput
  extends Pick<Prisma.ItemTypeFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetItemTypesInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: itemTypes,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.itemType.count({ where }),
      query: (paginateArgs) => db.itemType.findMany({ ...paginateArgs, where, orderBy }),
    })

    return {
      itemTypes,
      nextPage,
      hasMore,
      count,
    }
  }
)
