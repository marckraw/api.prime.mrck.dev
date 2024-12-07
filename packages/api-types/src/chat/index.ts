import { z } from 'zod'

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
}

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  role: z.enum(['user', 'assistant'])
}) 