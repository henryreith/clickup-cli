import { z } from 'zod'

export const CommentUserSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  email: z.string().optional(),
  profilePicture: z.string().nullable().optional(),
}).passthrough()

export const CommentSchema = z.object({
  id: z.string(),
  comment_text: z.string().optional(),
  text_content: z.string().optional(),
  comment: z.array(z.unknown()).optional(),
  resolved: z.boolean().optional(),
  assignee: CommentUserSchema.nullable().optional(),
  assigned_by: CommentUserSchema.nullable().optional(),
  user: CommentUserSchema.optional(),
  date: z.string().optional(),
  hist_id: z.string().optional(),
  reply_count: z.number().optional(),
}).passthrough()

export const CommentListResponseSchema = z.object({
  comments: z.array(CommentSchema),
}).passthrough()

export type CommentUser = z.infer<typeof CommentUserSchema>
export type Comment = z.infer<typeof CommentSchema>
export type CommentListResponse = z.infer<typeof CommentListResponseSchema>
