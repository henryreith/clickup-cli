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

export const ApplyTaskResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
}).passthrough()

export const ApplyListResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
}).passthrough()

export const ApplyFolderResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
}).passthrough()

export type ApplyTaskResponse = z.infer<typeof ApplyTaskResponseSchema>
export type ApplyListResponse = z.infer<typeof ApplyListResponseSchema>
export type ApplyFolderResponse = z.infer<typeof ApplyFolderResponseSchema>
