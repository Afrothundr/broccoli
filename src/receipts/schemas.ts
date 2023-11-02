import { z } from "zod"

export const CreateReceiptSchema = z.object({
  url: z.string(),
  groceryTripId: z.number(),
})
export const CreateBulkReceiptSchema = z.array(CreateReceiptSchema)
export const UpdateReceiptSchema = z.object({
  id: z.number(),
  // template: __fieldName__: z.__zodType__(),
})

export const DeleteReceiptSchema = z.object({
  id: z.number(),
})
