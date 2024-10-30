import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createTaskSchema, updateTaskSchema } from './validators/tasks'

const taskRouter = new Hono()

// Get all tasks
taskRouter.get('/', (c) => {
  return c.json({
    tasks: [] // Replace with actual tasks fetch logic
  })
})

// Get single task
taskRouter.get('/:id', (c) => {
  const id = c.req.param('id')
  return c.json({
    task: { id } // Replace with actual task fetch logic
  })
})

// Create task
taskRouter.post('/', zValidator('json', createTaskSchema), async (c) => {
  const data = await c.req.valid('json')
  return c.json({
    task: data // Replace with actual task creation logic
  }, 201)
})

// Update task
taskRouter.put('/:id', zValidator('json', updateTaskSchema), async (c) => {
  const id = c.req.param('id')
  const data = await c.req.valid('json')
  return c.json({
    task: { id, ...data } // Replace with actual task update logic
  })
})

// Delete task
taskRouter.delete('/:id', (c) => {
  const id = c.req.param('id')
  return c.json({
    message: `Task ${id} deleted` // Replace with actual task deletion logic
  })
})

export default taskRouter 