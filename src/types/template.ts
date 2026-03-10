import { z } from 'zod'

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
}).passthrough()

export const TemplateListResponseSchema = z.object({
  templates: z.array(TemplateSchema),
}).passthrough()

export type Template = z.infer<typeof TemplateSchema>
export type TemplateListResponse = z.infer<typeof TemplateListResponseSchema>
