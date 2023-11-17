import { z } from "zod"

export const CreateItemSchema = z.object({
  description: z.string().optional(),
  groceryTripId: z.string(),
  itemTypes: z.string().array(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  reminderSpanSeconds: z.number(),
  unit: z.string().optional(),
  userId: z.number(),
  // template: __fieldName__: z.__zodType__(),1
})
export const UpdateItemSchema = z.object({
  description: z.string(),
  groceryTripId: z.string(),
  itemTypes: z.string().array(),
  id: z.number(),
  name: z.string(),
  percentConsumed: z.number(),
  price: z.number(),
  quantity: z.number(),
  status: z.enum(["BAD", "EATEN", "FRESH", "OLD", "DISCARDED"]),
  unit: z.string(),
  // template: __fieldName__: z.__zodType__(),
})

export const DeleteItemSchema = z.object({
  ids: z.number().array(),
})
