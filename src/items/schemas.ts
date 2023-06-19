import { z } from "zod"

export const CreateItemSchema = z.object({
  description: z.string().optional(),
  grocerTripId: z.number(),
  itemTypeId: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  unit: z.string().optional(),
  // template: __fieldName__: z.__zodType__(),1
})
export const UpdateItemSchema = z.object({
  id: z.number(),
  description: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  unit: z.string(),
  itemTypeId: z.number(),
  // template: __fieldName__: z.__zodType__(),
})

export const DeleteItemSchema = z.object({
  id: z.number(),
})
