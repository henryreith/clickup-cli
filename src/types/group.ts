import { z } from 'zod'

export const GroupMemberSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  color: z.string().nullable().optional(),
  profilePicture: z.string().nullable().optional(),
  initials: z.string().optional(),
}).passthrough()

export const GroupSchema = z.object({
  id: z.string(),
  team_id: z.string().optional(),
  userid: z.number().optional(),
  name: z.string(),
  handle: z.string().nullable().optional(),
  date_created: z.string().nullable().optional(),
  initials: z.string().optional(),
  members: z.array(GroupMemberSchema).optional(),
  avatar: z.unknown().nullable().optional(),
}).passthrough()

export const GroupListResponseSchema = z.object({
  groups: z.array(GroupSchema),
}).passthrough()

export type GroupMember = z.infer<typeof GroupMemberSchema>
export type Group = z.infer<typeof GroupSchema>
export type GroupListResponse = z.infer<typeof GroupListResponseSchema>
