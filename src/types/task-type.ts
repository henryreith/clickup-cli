import { z } from 'zod'

export const CustomTaskTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  avatar: z.unknown().nullable().optional(),
}).passthrough()

export const CustomTaskTypeListResponseSchema = z.object({
  custom_items: z.array(CustomTaskTypeSchema),
}).passthrough()

export type CustomTaskType = z.infer<typeof CustomTaskTypeSchema>
export type CustomTaskTypeListResponse = z.infer<typeof CustomTaskTypeListResponseSchema>
