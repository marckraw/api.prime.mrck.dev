import { z } from "zod";

export const emailPayloadSchema = z.object({
  from: z.string().email(),
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
});

export const emailResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["success", "error"]),
  message: z.string().optional(),
});
