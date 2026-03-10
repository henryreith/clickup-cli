import { z } from 'zod'

export const WebhookHealthSchema = z.object({
  status: z.string().optional(),
  fail_count: z.number().optional(),
}).passthrough()

export const WebhookSchema = z.object({
  id: z.string(),
  userid: z.number().optional(),
  team_id: z.number().optional(),
  endpoint: z.string(),
  client_id: z.string().optional(),
  events: z.array(z.string()),
  task_id: z.string().nullable().optional(),
  list_id: z.string().nullable().optional(),
  folder_id: z.string().nullable().optional(),
  space_id: z.string().nullable().optional(),
  health: WebhookHealthSchema.optional(),
  secret: z.string().optional(),
}).passthrough()

export const WebhookListResponseSchema = z.object({
  webhooks: z.array(WebhookSchema),
}).passthrough()

export const WebhookResponseSchema = z.object({
  id: z.string(),
  webhook: WebhookSchema,
}).passthrough()

export type WebhookHealth = z.infer<typeof WebhookHealthSchema>
export type Webhook = z.infer<typeof WebhookSchema>
export type WebhookListResponse = z.infer<typeof WebhookListResponseSchema>
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>
