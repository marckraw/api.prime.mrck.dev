import { z } from 'zod'

export const analyzeImageSchema = z.object({
  imageUrl: z.string().url(),
}).refine((data) => data.imageUrl, {
  message: "ImageUrl must be provided"
});

export type AnalyzeImageInput = z.infer<typeof analyzeImageSchema> 