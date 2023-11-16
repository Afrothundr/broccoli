import { z } from "zod"

export const CreateItemSchema = z.object({
  description: z.string().optional(),
  groceryTripId: z.string(),
  itemTypes: z.string().array(),
  userId: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  unit: z.string().optional(),
  reminderSpanSeconds: z.number(),
  // template: __fieldName__: z.__zodType__(),1
})
export const UpdateItemSchema = z.object({
  id: z.number(),
  description: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  unit: z.string(),
  status: z.enum(["BAD", "EATEN", "FRESH", "OLD", "DISCARDED"]),
  // template: __fieldName__: z.__zodType__(),
})

export const DeleteItemSchema = z.object({
  ids: z.number().array(),
})
