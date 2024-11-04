import { z } from 'zod'

export const analyzeImageSchema = z.object({
  imageUrl: z.string().url().optional(),
  base64Image: z.string().optional(),
}).refine((data) => data.imageUrl || data.base64Image, {
  message: "Either imageUrl or base64Image must be provided"
});

export type AnalyzeImageInput = z.infer<typeof analyzeImageSchema> 