import { z } from 'zod'

export const TaskStatusSchema = z.object({
  status: z.string(),
  color: z.string().optional(),
  type: z.string().optional(),
  orderindex: z.number().optional(),
}).passthrough()

export const TaskPrioritySchema = z.object({
  id: z.string().optional(),
  priority: z.string().nullable().optional(),
  color: z.string().optional(),
  orderindex: z.string().optional(),
}).passthrough()

export const TaskUserSchema = z.object({
  id: z.union([z.string(), z.number()]),
  username: z.string().optional(),
  email: z.string().optional(),
  color: z.string().nullable().optional(),
  profilePicture: z.string().nullable().optional(),
}).passthrough()

export const TaskTagSchema = z.object({
  name: z.string(),
  tag_fg: z.string().optional(),
  tag_bg: z.string().optional(),
}).passthrough()

export const TaskCustomFieldSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.string().optional(),
  value: z.unknown().optional().nullable(),
  type_config: z.unknown().optional(),
  required: z.boolean().optional(),
}).passthrough()

export const TaskSchema = z.object({
  id: z.string(),
  custom_id: z.string().nullable().optional(),
  name: z.string(),
  text_content: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  markdown_description: z.string().nullable().optional(),
  status: TaskStatusSchema.optional().nullable(),
  priority: TaskPrioritySchema.optional().nullable(),
  creator: TaskUserSchema.optional(),
  assignees: z.array(TaskUserSchema).optional(),
  watchers: z.array(TaskUserSchema).optional(),
  tags: z.array(TaskTagSchema).optional(),
  parent: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  time_estimate: z.number().nullable().optional(),
  points: z.number().nullable().optional(),
  custom_fields: z.array(TaskCustomFieldSchema).optional(),
  list: z.object({
    id: z.string(),
    name: z.string().optional(),
    access: z.boolean().optional(),
  }).passthrough().optional(),
  folder: z.object({
    id: z.string(),
    name: z.string().optional(),
    hidden: z.boolean().optional(),
    access: z.boolean().optional(),
  }).passthrough().optional(),
  space: z.object({
    id: z.string(),
  }).passthrough().optional(),
  url: z.string().optional(),
  archived: z.boolean().optional(),
  date_created: z.string().optional(),
  date_updated: z.string().optional(),
  date_closed: z.string().nullable().optional(),
  orderindex: z.string().optional(),
  linked_tasks: z.array(z.unknown()).optional(),
  team_id: z.string().optional(),
  subtasks: z.array(z.unknown()).optional(),
}).passthrough()

export const TaskListResponseSchema = z.object({
  tasks: z.array(TaskSchema),
}).passthrough()

export const TaskSearchResponseSchema = z.object({
  tasks: z.array(TaskSchema),
}).passthrough()

export const TimeInStatusEntrySchema = z.object({
  status: z.string(),
  color: z.string().optional(),
  total_time: z.object({
    by_minute: z.number().optional(),
    since: z.string().optional(),
  }).passthrough().optional(),
  orderindex: z.number().optional(),
}).passthrough()

export const TimeInStatusResponseSchema = z.object({
  current_status: TimeInStatusEntrySchema.optional(),
  status_history: z.array(TimeInStatusEntrySchema).optional(),
}).passthrough()

export type Task = z.infer<typeof TaskSchema>
export type TaskListResponse = z.infer<typeof TaskListResponseSchema>
export type TaskSearchResponse = z.infer<typeof TaskSearchResponseSchema>
export type TimeInStatusResponse = z.infer<typeof TimeInStatusResponseSchema>
