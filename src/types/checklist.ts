import { z } from 'zod'

export const ChecklistItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  orderindex: z.number().optional(),
  assignee: z.unknown().nullable().optional(),
  resolved: z.boolean().optional(),
  parent: z.string().nullable().optional(),
  date_created: z.string().optional(),
  children: z.array(z.unknown()).optional(),
}).passthrough()

export const ChecklistSchema = z.object({
  id: z.string(),
  task_id: z.string().optional(),
  name: z.string(),
  orderindex: z.number().optional(),
  resolved: z.number().optional(),
  unresolved: z.number().optional(),
  items: z.array(ChecklistItemSchema).optional(),
  date_created: z.string().optional(),
}).passthrough()

export const ChecklistResponseSchema = z.object({
  checklist: ChecklistSchema,
}).passthrough()

export type Checklist = z.infer<typeof ChecklistSchema>
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>
export type ChecklistResponse = z.infer<typeof ChecklistResponseSchema>
