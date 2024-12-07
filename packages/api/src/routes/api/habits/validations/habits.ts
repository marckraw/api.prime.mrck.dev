import { z } from "zod"

// Validation schemas
const createHabitSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    target: z.number().min(1),
    userId: z.number(),
  })
  
  const updateHabitSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    target: z.number().min(1).optional(),
    isArchived: z.boolean().optional(),
  })
  
  const logHabitSchema = z.object({
    habitId: z.number(),
    completedAt: z.string(), // ISO date string
    notes: z.string().optional(),
  })

export { createHabitSchema, updateHabitSchema, logHabitSchema }