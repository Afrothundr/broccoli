import { resolver } from "@blitzjs/rpc"
import db from "db"
import { DeleteReminderSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteReminderSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const reminder = await db.reminder.deleteMany({ where: { id } })

    return reminder
  }
)
