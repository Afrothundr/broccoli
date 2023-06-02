import { resolver } from "@blitzjs/rpc"
import db from "db"
import { UpdateReminderSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateReminderSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const reminder = await db.reminder.update({ where: { id }, data })

    return reminder
  }
)
