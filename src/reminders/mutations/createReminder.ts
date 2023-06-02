import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateReminderSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(CreateReminderSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const reminder = await db.reminder.create({ data: input })

    return reminder
  }
)
