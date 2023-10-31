import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"

interface GetReceiptsInput
  extends Pick<Prisma.ReceiptFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetReceiptsInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: receipts,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.receipt.count({ where }),
      query: (paginateArgs) => db.receipt.findMany({ ...paginateArgs, where, orderBy }),
    })

    return {
      receipts,
      nextPage,
      hasMore,
      count,
    }
  }
)
