import { Hono } from 'hono'
import { zValidator } from "@hono/zod-validator"
import { z } from 'zod'
import { db } from '../../../db'
import { habits, habitLogs } from '../../../db/schema/habits'
import { eq, and, gte, lte } from 'drizzle-orm'

const habitRouter = new Hono()

// Validation schemas
const createHabitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  target: z.number().min(1),
})

const logHabitSchema = z.object({
  habitId: z.number(),
  completedAt: z.string(), // ISO date string
  notes: z.string().optional(),
})

// Create new habit
habitRouter.post('/', zValidator('json', createHabitSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    // TODO: Get userId from authenticated session
    const userId = 1 // Placeholder

    const [habit] = await db.insert(habits).values({
      ...data,
      userId,
    }).returning()

    return c.json({ habit })
  } catch (error) {
    console.error('Error creating habit:', error)
    return c.json({ error: 'Failed to create habit' }, 500)
  }
})

// Get all habits for user
habitRouter.get('/', async (c) => {
  try {
    // TODO: Get userId from authenticated session
    const userId = 1 // Placeholder

    const userHabits = await db
      .select()
      .from(habits)
      .where(and(
        eq(habits.userId, userId),
        eq(habits.isArchived, false)
      ))

    return c.json({ habits: userHabits })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return c.json({ error: 'Failed to fetch habits' }, 500)
  }
})

// Log habit completion
habitRouter.post('/log', zValidator('json', logHabitSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    // TODO: Get userId from authenticated session
    const userId = 1 // Placeholder

    const [log] = await db.insert(habitLogs).values({
      ...data,
      userId,
    }).returning()

    return c.json({ log })
  } catch (error) {
    console.error('Error logging habit:', error)
    return c.json({ error: 'Failed to log habit' }, 500)
  }
})

// Get habit stats for date range
habitRouter.get('/stats', async (c) => {
  try {
    const { startDate, endDate, habitId } = c.req.query()
    // TODO: Get userId from authenticated session
    const userId = 1 // Placeholder

    const logs = await db
      .select()
      .from(habitLogs)
      .where(and(
        eq(habitLogs.userId, userId),
        habitId ? eq(habitLogs.habitId, parseInt(habitId)) : undefined,
        startDate ? gte(habitLogs.completedAt, startDate) : undefined,
        endDate ? lte(habitLogs.completedAt, endDate) : undefined,
      ))

    return c.json({ logs })
  } catch (error) {
    console.error('Error fetching habit stats:', error)
    return c.json({ error: 'Failed to fetch habit stats' }, 500)
  }
})

export default habitRouter 