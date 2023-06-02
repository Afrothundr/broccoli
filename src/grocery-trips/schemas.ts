import { z } from "zod"

export const CreateGroceryTripSchema = z.object({
  // template: __fieldName__: z.__zodType__(),
})
export const UpdateGroceryTripSchema = z.object({
  id: z.number(),
  // template: __fieldName__: z.__zodType__(),
})

export const DeleteGroceryTripSchema = z.object({
  id: z.number(),
})
