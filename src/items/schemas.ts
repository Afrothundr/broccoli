import { z } from "zod"

export const CreateItemSchema = z.object({
  description: z.string(),
  // template: __fieldName__: z.__zodType__(),
})
export const UpdateItemSchema = z.object({
  id: z.number(),
  // template: __fieldName__: z.__zodType__(),
})

export const DeleteItemSchema = z.object({
  id: z.number(),
})
