import { z } from 'zod'

export const MemberSchema = z.object({
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    color: z.string().nullable().optional(),
    profilePicture: z.string().nullable().optional(),
    initials: z.string().optional(),
    role: z.number().optional(),
  }).passthrough(),
  invited_by: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
  }).passthrough().optional(),
}).passthrough()

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  members: z.array(MemberSchema).optional(),
}).passthrough()

export const WorkspaceListResponseSchema = z.object({
  teams: z.array(WorkspaceSchema),
}).passthrough()

export const SeatsSchema = z.object({
  members: z.object({
    filled_members_count: z.number().optional(),
    total_member_seats: z.number().optional(),
    empty_member_seats: z.number().optional(),
  }).passthrough().optional(),
  guests: z.object({
    filled_guest_count: z.number().optional(),
    total_guest_seats: z.number().optional(),
    empty_guest_seats: z.number().optional(),
  }).passthrough().optional(),
}).passthrough()

export const PlanSchema = z.object({
  plan_id: z.number().optional(),
  plan_name: z.string().optional(),
}).passthrough()

export type Workspace = z.infer<typeof WorkspaceSchema>
export type WorkspaceListResponse = z.infer<typeof WorkspaceListResponseSchema>
export type Seats = z.infer<typeof SeatsSchema>
export type Plan = z.infer<typeof PlanSchema>
