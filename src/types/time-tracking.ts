import { z } from 'zod'

export const TimeEntryTagSchema = z.object({
  name: z.string(),
  creator: z.number().optional(),
  status: z.string().optional(),
}).passthrough()

export const TimeEntryTaskSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  status: z.unknown().optional(),
  custom_type: z.unknown().nullable().optional(),
}).passthrough()

export const TimeEntryUserSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  email: z.string().optional(),
  profilePicture: z.string().nullable().optional(),
}).passthrough()

export const TimeEntrySchema = z.object({
  id: z.string(),
  task: TimeEntryTaskSchema.optional(),
  wid: z.string().optional(),
  user: TimeEntryUserSchema.optional(),
  billable: z.boolean().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  duration: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(TimeEntryTagSchema).optional(),
  at: z.string().optional(),
  is_running: z.boolean().optional(),
  task_url: z.string().optional(),
}).passthrough()

export const TimeEntryListResponseSchema = z.object({
  data: z.array(TimeEntrySchema),
}).passthrough()

export const TimeEntrySingleResponseSchema = z.object({
  data: TimeEntrySchema,
}).passthrough()

export const RunningTimeEntryResponseSchema = z.object({
  data: TimeEntrySchema.nullable(),
}).passthrough()

export const TimeEntryTagListResponseSchema = z.object({
  data: z.array(TimeEntryTagSchema),
}).passthrough()

export const TimeEntryHistorySchema = z.object({
  id: z.string().optional(),
  field: z.string().optional(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  date: z.string().optional(),
  user: TimeEntryUserSchema.optional(),
}).passthrough()

export const TimeEntryHistoryResponseSchema = z.object({
  data: z.array(TimeEntryHistorySchema),
}).passthrough()

export type TimeEntryTag = z.infer<typeof TimeEntryTagSchema>
export type TimeEntryTask = z.infer<typeof TimeEntryTaskSchema>
export type TimeEntryUser = z.infer<typeof TimeEntryUserSchema>
export type TimeEntry = z.infer<typeof TimeEntrySchema>
export type TimeEntryListResponse = z.infer<typeof TimeEntryListResponseSchema>
export type TimeEntrySingleResponse = z.infer<typeof TimeEntrySingleResponseSchema>
export type RunningTimeEntryResponse = z.infer<typeof RunningTimeEntryResponseSchema>
export type TimeEntryTagListResponse = z.infer<typeof TimeEntryTagListResponseSchema>
export type TimeEntryHistory = z.infer<typeof TimeEntryHistorySchema>
export type TimeEntryHistoryResponse = z.infer<typeof TimeEntryHistoryResponseSchema>
