import { z } from "zod"

export const CreateItemTypeSchema = z.object({
  // template: __fieldName__: z.__zodType__(),
})
export const UpdateItemTypeSchema = z.object({
  id: z.number(),
  // template: __fieldName__: z.__zodType__(),
})

export const DeleteItemTypeSchema = z.object({
  id: z.number(),
})
