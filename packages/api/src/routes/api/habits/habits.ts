import { Hono } from 'hono'
import { zValidator } from "@hono/zod-validator"
import { z } from 'zod'
import { db } from '../../../db'
import { habits, habitLogs } from '../../../db/schema/habits'
import { eq, and, gte, lte } from 'drizzle-orm'
import { createHabitSchema, updateHabitSchema, logHabitSchema } from './validations/habits'

const habitRouter = new Hono()

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

    console.log(startDate, endDate, habitId, userId)
    
    // Validate numeric parameters
    const parsedHabitId = habitId ? parseInt(habitId) : undefined
    const parsedUserId = userId ? parseInt(userId) : undefined

    const logs = await db
      .select()
      .from(habitLogs)
      // .where(and(
      //   parsedUserId ? eq(habitLogs.userId, parsedUserId) : undefined,
      //   parsedHabitId ? eq(habitLogs.habitId, parsedHabitId) : undefined,
      // ))

    return c.json({ logs })
  } catch (error) {
    console.error('Error fetching habit stats:', error)
    return c.json({ error: 'Failed to fetch habit stats' }, 500)
  }
})

// Get specific habit
habitRouter.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid habit ID format' }, 400)
    }

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
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid habit ID format' }, 400)
    }

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
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid habit ID format' }, 400)
    }

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

export default habitRouter 