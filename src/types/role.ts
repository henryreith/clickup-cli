import { z } from 'zod'

export const CustomRoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  custom: z.boolean().optional(),
  date_created: z.string().nullable().optional(),
  members_count: z.number().optional(),
}).passthrough()

export const RoleListResponseSchema = z.object({
  custom_roles: z.array(CustomRoleSchema),
}).passthrough()

export type CustomRole = z.infer<typeof CustomRoleSchema>
export type RoleListResponse = z.infer<typeof RoleListResponseSchema>
