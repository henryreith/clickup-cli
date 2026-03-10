import { z } from 'zod'

export const GuestSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  color: z.string().nullable().optional(),
  profilePicture: z.string().nullable().optional(),
  initials: z.string().optional(),
  can_edit_tags: z.boolean().optional(),
  can_see_time_spent: z.boolean().optional(),
  can_see_time_estimated: z.boolean().optional(),
}).passthrough()

export const GuestResponseSchema = z.object({
  guest: GuestSchema,
}).passthrough()

export const GuestWithSharedSchema = z.object({
  guest: GuestSchema.extend({
    shared: z.object({
      tasks: z.array(z.unknown()).optional(),
      lists: z.array(z.unknown()).optional(),
      folders: z.array(z.unknown()).optional(),
    }).passthrough().optional(),
  }).passthrough(),
}).passthrough()

export type Guest = z.infer<typeof GuestSchema>
export type GuestResponse = z.infer<typeof GuestResponseSchema>
export type GuestWithShared = z.infer<typeof GuestWithSharedSchema>
