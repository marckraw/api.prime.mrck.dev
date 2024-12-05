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

// Create new habit
habitRouter.post('/', zValidator('json', createHabitSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const [habit] = await db.insert(habits).values(data).returning()
    return c.json({ habit })
  } catch (error) {
    console.error('Error creating habit:', error)
    return c.json({ error: 'Failed to create habit' }, 500)
  }
})

// Get all habits
habitRouter.get('/', async (c) => {
  try {
    const userId = c.req.query('userId')
    
    const query = userId 
      ? db.select().from(habits).where(and(
          eq(habits.userId, parseInt(userId)),
          eq(habits.isArchived, false)
        ))
      : db.select().from(habits).where(eq(habits.isArchived, false))

    const allHabits = await query
    return c.json({ habits: allHabits })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return c.json({ error: 'Failed to fetch habits' }, 500)
  }
})

// Get specific habit
habitRouter.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const [habit] = await db
      .select()
      .from(habits)
      .where(eq(habits.id, id))

    if (!habit) {
      return c.json({ error: 'Habit not found' }, 404)
    }

    return c.json({ habit })
  } catch (error) {
    console.error('Error fetching habit:', error)
    return c.json({ error: 'Failed to fetch habit' }, 500)
  }
})

// Update habit
habitRouter.patch('/:id', zValidator('json', updateHabitSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const data = c.req.valid('json')
    
    const [updatedHabit] = await db
      .update(habits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(habits.id, id))
      .returning()
    
    if (!updatedHabit) {
      return c.json({ error: 'Habit not found' }, 404)
    }
    
    return c.json({ habit: updatedHabit })
  } catch (error) {
    console.error('Error updating habit:', error)
    return c.json({ error: 'Failed to update habit' }, 500)
  }
})

// Delete habit (soft delete by archiving)
habitRouter.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const [archivedHabit] = await db
      .update(habits)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(habits.id, id))
      .returning()
    
    if (!archivedHabit) {
      return c.json({ error: 'Habit not found' }, 404)
    }
    
    return c.json({ message: 'Habit archived successfully' })
  } catch (error) {
    console.error('Error archiving habit:', error)
    return c.json({ error: 'Failed to archive habit' }, 500)
  }
})

// Log habit completion
habitRouter.post('/log', zValidator('json', logHabitSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const [log] = await db.insert(habitLogs).values(data).returning()
    return c.json({ log })
  } catch (error) {
    console.error('Error logging habit:', error)
    return c.json({ error: 'Failed to log habit' }, 500)
  }
})

// Get habit stats for date range
habitRouter.get('/stats', async (c) => {
  try {
    const { startDate, endDate, habitId, userId } = c.req.query()
    
    const logs = await db
      .select()
      .from(habitLogs)
      .where(and(
        userId ? eq(habitLogs.userId, parseInt(userId)) : undefined,
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