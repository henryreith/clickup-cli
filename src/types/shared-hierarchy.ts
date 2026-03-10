import { z } from 'zod'

export const SharedTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.object({ status: z.string() }).passthrough().optional(),
  date_created: z.string().nullable().optional(),
  date_updated: z.string().nullable().optional(),
}).passthrough()

export const SharedListSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string().optional(),
  due_date: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  folder: z.object({ id: z.string(), name: z.string() }).passthrough().optional(),
  space: z.object({ id: z.string(), name: z.string() }).passthrough().optional(),
}).passthrough()

export const SharedFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  space: z.object({ id: z.string(), name: z.string() }).passthrough().optional(),
}).passthrough()

export const SharedHierarchyResponseSchema = z.object({
  shared: z.object({
    tasks: z.array(SharedTaskSchema).optional().default([]),
    lists: z.array(SharedListSchema).optional().default([]),
    folders: z.array(SharedFolderSchema).optional().default([]),
  }),
}).passthrough()

export type SharedTask = z.infer<typeof SharedTaskSchema>
export type SharedList = z.infer<typeof SharedListSchema>
export type SharedFolder = z.infer<typeof SharedFolderSchema>
export type SharedHierarchyResponse = z.infer<typeof SharedHierarchyResponseSchema>
