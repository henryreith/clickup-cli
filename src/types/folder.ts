import { z } from 'zod'

export const FolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  orderindex: z.number().optional(),
  override_statuses: z.boolean().optional(),
  hidden: z.boolean().optional(),
  space: z.object({
    id: z.string(),
    name: z.string().optional(),
  }).passthrough().optional(),
  task_count: z.string().optional(),
  archived: z.boolean().optional(),
  lists: z.array(z.unknown()).optional(),
}).passthrough()

export const FolderListResponseSchema = z.object({
  folders: z.array(FolderSchema),
}).passthrough()

export type Folder = z.infer<typeof FolderSchema>
export type FolderListResponse = z.infer<typeof FolderListResponseSchema>
