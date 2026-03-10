import { z } from 'zod'

export const TagSchema = z.object({
  name: z.string(),
  tag_fg: z.string().optional(),
  tag_bg: z.string().optional(),
  creator: z.unknown().optional(),
}).passthrough()

export const TagListResponseSchema = z.object({
  tags: z.array(TagSchema),
}).passthrough()

export type Tag = z.infer<typeof TagSchema>
export type TagListResponse = z.infer<typeof TagListResponseSchema>
