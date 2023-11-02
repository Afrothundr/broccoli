import { z } from "zod"

export const CreateReminderSchema = z.object({
  userId: z.number(),
  itemId: z.number(),
  time: z.string(),
  // template: __fieldName__: z.__zodType__(),
})
export const UpdateReminderSchema = z.object({
  id: z.number(),
  userId: z.number(),
  itemId: z.number(),
  // template: __fieldName__: z.__zodType__(),
})

export const DeleteReminderSchema = z.object({
  id: z.number(),
})
