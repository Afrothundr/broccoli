import { z } from "zod"

export const CreateReceiptSchema = z.object({
  // template: __fieldName__: z.__zodType__(),
})
export const UpdateReceiptSchema = z.object({
  id: z.number(),
  // template: __fieldName__: z.__zodType__(),
})

export const DeleteReceiptSchema = z.object({
  id: z.number(),
})
