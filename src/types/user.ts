import { z } from 'zod'

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  color: z.string().nullable().optional(),
  profilePicture: z.string().nullable().optional(),
  initials: z.string().optional(),
  role: z.number().optional(),
  custom_role_id: z.number().nullable().optional(),
  last_active: z.string().nullable().optional(),
  date_joined: z.string().nullable().optional(),
}).passthrough()

export const InviteUserResponseSchema = z.object({
  team: z.object({
    id: z.string(),
    name: z.string(),
    members: z.array(z.unknown()).optional(),
  }).passthrough(),
}).passthrough()

export const GetUserResponseSchema = z.object({
  member: z.object({
    user: UserSchema,
    invited_by: z.object({
      id: z.number(),
      username: z.string(),
      email: z.string(),
    }).passthrough().optional(),
  }).passthrough(),
}).passthrough()

export type User = z.infer<typeof UserSchema>
export type InviteUserResponse = z.infer<typeof InviteUserResponseSchema>
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>
