import { z } from 'zod'

export const TaskMemberSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  color: z.string().nullable().optional(),
  profilePicture: z.string().nullable().optional(),
  initials: z.string().optional(),
}).passthrough()

export const MemberListResponseSchema = z.object({
  members: z.array(TaskMemberSchema),
}).passthrough()

export type TaskMember = z.infer<typeof TaskMemberSchema>
export type MemberListResponse = z.infer<typeof MemberListResponseSchema>
