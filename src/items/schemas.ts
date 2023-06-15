import { z } from "zod"

export const CreateItemSchema = z.object({
  description: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  unit: z.string(),
  itemTypeId: z.number(),
  grocerTripId: z.number(),
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
