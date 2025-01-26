import { z } from "zod";

// Base response structure
export const baseResponseSchema = z.object({
  success: z.boolean(),
  error: z
    .object({
      message: z.string(),
      code: z.string(),
    })
    .optional(),
});

// Chat message structure
export const chatMessageSchema = z.object({
  role: z.enum(["user", "system", "assistant"]),
  content: z.string(),
});

// Chat response
export const chatResponseSchema = baseResponseSchema.extend({
  data: z.object({
    messages: z.array(chatMessageSchema),
  }),
});

// AGI response
export const agiResponseSchema = baseResponseSchema.extend({
  data: z.object({
    messages: z.array(chatMessageSchema),
    conversationId: z.string().optional(),
    suggestedAction: z.string().optional(),
    debug: z.record(z.any()).optional(),
    channel: z.string().optional(),
    intentionValidation: z.record(z.any()).optional(),
  }),
});

// TypeScript types
export type BaseResponse = z.infer<typeof baseResponseSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type AgiResponse = z.infer<typeof agiResponseSchema>;
