import { z } from 'zod'

export const StatusSchema = z.object({
  id: z.string().optional(),
  status: z.string(),
  type: z.string().optional(),
  orderindex: z.number().optional(),
  color: z.string().optional(),
}).passthrough()

export const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  private: z.boolean().optional(),
  color: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  admin_can_manage: z.boolean().nullable().optional(),
  statuses: z.array(StatusSchema).optional(),
  multiple_assignees: z.boolean().optional(),
  features: z.record(z.unknown()).optional(),
  archived: z.boolean().optional(),
}).passthrough()

export const SpaceListResponseSchema = z.object({
  spaces: z.array(SpaceSchema),
}).passthrough()

export type Space = z.infer<typeof SpaceSchema>
export type SpaceListResponse = z.infer<typeof SpaceListResponseSchema>
