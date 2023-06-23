import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"

interface GetGroceryTripsInput
  extends Pick<Prisma.GroceryTripFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetGroceryTripsInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: groceryTrips,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.groceryTrip.count({ where }),
      query: (paginateArgs) =>
        db.groceryTrip.findMany({
          ...paginateArgs,
          where,
          orderBy,
          include: {
            _count: {
              select: { items: true },
            },
          },
        }),
    })

    return {
      groceryTrips,
      nextPage,
      hasMore,
      count,
    }
  }
)
