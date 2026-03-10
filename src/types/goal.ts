import { z } from 'zod'

export const GoalOwnerSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  email: z.string().optional(),
  profilePicture: z.string().nullable().optional(),
}).passthrough()

export const KeyResultSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.string().optional(),
  steps_start: z.number().optional(),
  steps_end: z.number().optional(),
  steps_current: z.number().optional(),
  unit: z.string().optional(),
  task_ids: z.array(z.string()).optional(),
  list_ids: z.array(z.string()).optional(),
  creator: z.number().optional(),
  goal_id: z.string().optional(),
  date_created: z.string().optional(),
  last_action: z.unknown().optional(),
  percent_completed: z.number().optional(),
}).passthrough()

export const GoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  date_created: z.string().optional(),
  creator: z.number().optional(),
  owners: z.array(GoalOwnerSchema).optional(),
  key_results: z.array(KeyResultSchema).optional(),
  percent_completed: z.number().optional(),
  multiple_owners: z.boolean().optional(),
  folder_id: z.string().nullable().optional(),
  team_id: z.string().optional(),
  pretty_id: z.string().optional(),
}).passthrough()

export const GoalListResponseSchema = z.object({
  goals: z.array(GoalSchema),
  folders: z.array(z.unknown()).optional(),
}).passthrough()

export const GoalResponseSchema = z.object({
  goal: GoalSchema,
}).passthrough()

export const KeyResultResponseSchema = z.object({
  key_result: KeyResultSchema,
}).passthrough()

export type GoalOwner = z.infer<typeof GoalOwnerSchema>
export type KeyResult = z.infer<typeof KeyResultSchema>
export type Goal = z.infer<typeof GoalSchema>
export type GoalListResponse = z.infer<typeof GoalListResponseSchema>
export type GoalResponse = z.infer<typeof GoalResponseSchema>
export type KeyResultResponse = z.infer<typeof KeyResultResponseSchema>
