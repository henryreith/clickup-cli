import { z } from 'zod'

export const ViewCreatorSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  email: z.string().optional(),
  profilePicture: z.string().nullable().optional(),
}).passthrough()

export const ViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  date_created: z.string().optional(),
  creator: ViewCreatorSchema.optional(),
  visibility: z.string().optional(),
  protected: z.boolean().optional(),
  parent: z.unknown().optional(),
  grouping: z.unknown().optional(),
  sorting: z.unknown().optional(),
  filters: z.unknown().optional(),
  columns: z.unknown().optional(),
  team_sidebar: z.unknown().optional(),
  settings: z.unknown().optional(),
  divide: z.unknown().optional(),
}).passthrough()

export const ViewListResponseSchema = z.object({
  views: z.array(ViewSchema),
}).passthrough()

export const ViewResponseSchema = z.object({
  view: ViewSchema,
}).passthrough()

export const ViewTasksResponseSchema = z.object({
  tasks: z.array(z.record(z.unknown())),
  last_page: z.boolean().optional(),
}).passthrough()

export type ViewCreator = z.infer<typeof ViewCreatorSchema>
export type View = z.infer<typeof ViewSchema>
export type ViewListResponse = z.infer<typeof ViewListResponseSchema>
export type ViewResponse = z.infer<typeof ViewResponseSchema>
export type ViewTasksResponse = z.infer<typeof ViewTasksResponseSchema>
