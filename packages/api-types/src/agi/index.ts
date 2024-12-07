import { z } from "zod"

// Example type and validator
export interface ApiResponse<T> {
    data: T
    status: number
    message: string
  }
  
  export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
    z.object({
      data: dataSchema,
      status: z.number(),
      message: z.string()
    })