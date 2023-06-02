import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"

interface GetRemindersInput
  extends Pick<Prisma.ReminderFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where, orderBy, skip = 0, take = 100 }: GetRemindersInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: reminders,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.reminder.count({ where }),
      query: (paginateArgs) => db.reminder.findMany({ ...paginateArgs, where, orderBy }),
    })

    return {
      reminders,
      nextPage,
      hasMore,
      count,
    }
  }
)
