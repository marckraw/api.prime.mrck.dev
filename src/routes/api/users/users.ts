import { Hono } from 'hono'
import { zValidator } from "@hono/zod-validator"
import { z } from 'zod'
import { db } from '../../../db'
import { users } from '../../../db/schema/user'
import { eq } from 'drizzle-orm'

const userRouter = new Hono()

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
})

// Create new user
userRouter.post('/', zValidator('json', createUserSchema), async (c) => {
  try {
    const data = c.req.valid('json')
    const [user] = await db.insert(users).values(data).returning()
    return c.json({ user })
  } catch (error) {
    console.error('Error creating user:', error)
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// Get all users
userRouter.get('/', async (c) => {
  try {
    const allUsers = await db.select().from(users)
    return c.json({ users: allUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

// Get user by ID
userRouter.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const [user] = await db.select().from(users).where(eq(users.id, id))
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return c.json({ error: 'Failed to fetch user' }, 500)
  }
})

// Update user
userRouter.patch('/:id', zValidator('json', updateUserSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const data = c.req.valid('json')
    
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    
    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return c.json({ error: 'Failed to update user' }, 500)
  }
})

// Delete user
userRouter.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const [deletedUser] = await db.delete(users).where(eq(users.id, id)).returning()
    
    if (!deletedUser) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return c.json({ error: 'Failed to delete user' }, 500)
  }
})

export default userRouter