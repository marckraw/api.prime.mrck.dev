import { z } from 'zod'

export const analyzeImageSchema = z.object({
  imageUrl: z.string().url(),
  model: z.object({
    company: z.enum(["openai", "anthropic"]),
    model: z.string(),
  }).optional(),
  debug: z.boolean().optional(),
}).refine((data) => data.imageUrl, {
  message: "ImageUrl must be provided"
});

export type AnalyzeImageInput = z.infer<typeof analyzeImageSchema> 