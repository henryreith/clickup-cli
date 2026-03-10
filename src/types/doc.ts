import { z } from 'zod'

export const DocSchema = z.object({
  id: z.string(),
  name: z.string(),
  workspace_id: z.string().optional(),
  parent: z.object({ id: z.string(), type: z.number() }).passthrough().nullable().optional(),
  date_created: z.string().nullable().optional(),
  date_updated: z.string().nullable().optional(),
  deleted: z.boolean().optional(),
  creator: z.number().nullable().optional(),
}).passthrough()

export const DocListResponseSchema = z.object({
  docs: z.array(DocSchema).optional().default([]),
}).passthrough()

export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string().optional(),
  date_created: z.string().nullable().optional(),
  date_updated: z.string().nullable().optional(),
  deleted: z.boolean().optional(),
  creator: z.number().nullable().optional(),
  parent_page: z.string().nullable().optional(),
}).passthrough()

export const PageListResponseSchema = z.object({
  pages: z.array(PageSchema).optional().default([]),
}).passthrough()

export type Doc = z.infer<typeof DocSchema>
export type DocListResponse = z.infer<typeof DocListResponseSchema>
export type Page = z.infer<typeof PageSchema>
export type PageListResponse = z.infer<typeof PageListResponseSchema>
