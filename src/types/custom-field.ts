import { z } from 'zod'

export const CustomFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  type_config: z.unknown().optional(),
  date_created: z.string().optional(),
  hide_from_guests: z.boolean().optional(),
  required: z.boolean().optional(),
}).passthrough()

export const CustomFieldListResponseSchema = z.object({
  fields: z.array(CustomFieldSchema),
}).passthrough()

export type CustomField = z.infer<typeof CustomFieldSchema>
export type CustomFieldListResponse = z.infer<typeof CustomFieldListResponseSchema>
