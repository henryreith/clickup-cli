import { z } from 'zod'

export const ListStatusSchema = z.object({
  status: z.string(),
  color: z.string().optional(),
  hide_label: z.boolean().optional(),
}).passthrough()

export const ListSchema = z.object({
  id: z.string(),
  name: z.string(),
  orderindex: z.number().optional(),
  content: z.string().optional().nullable(),
  status: ListStatusSchema.optional().nullable(),
  priority: z.object({
    priority: z.string().optional(),
    color: z.string().optional(),
  }).passthrough().optional().nullable(),
  assignee: z.unknown().optional().nullable(),
  due_date: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  folder: z.object({
    id: z.string(),
    name: z.string().optional(),
    hidden: z.boolean().optional(),
    access: z.boolean().optional(),
  }).passthrough().optional(),
  space: z.object({
    id: z.string(),
    name: z.string().optional(),
    access: z.boolean().optional(),
  }).passthrough().optional(),
  task_count: z.union([z.string(), z.number()]).optional().nullable(),
  archived: z.boolean().optional(),
  override_statuses: z.boolean().optional(),
  permission_level: z.string().optional(),
}).passthrough()

export const ListListResponseSchema = z.object({
  lists: z.array(ListSchema),
}).passthrough()

export type List = z.infer<typeof ListSchema>
export type ListListResponse = z.infer<typeof ListListResponseSchema>
