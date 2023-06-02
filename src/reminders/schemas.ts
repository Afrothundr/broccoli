import { z } from "zod"

export const CreateReminderSchema = z.object({
  userId: z.undefined(),
  time: z.string(),
  id: z.string(),
  // template: __fieldName__: z.__zodType__(),
})
export const UpdateReminderSchema = z.object({
  id: z.number(),
  userId: z.undefined(),
  // template: __fieldName__: z.__zodType__(),
})

export const DeleteReminderSchema = z.object({
  id: z.number(),
})
