import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createTaskSchema, updateTaskSchema } from './validators/tasks'
import { config } from '../../../config.env'

const TODOIST_API_URL = 'https://api.todoist.com/rest/v2'
const ASANA_API_URL = 'https://app.asana.com/api/1.0'

const taskRouter = new Hono()

async function fetchTodoistTasks() {
  const response = await fetch(`${TODOIST_API_URL}/tasks`, {
    headers: {
      'Authorization': `Bearer ${config.TODOIST_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Todoist API error: ${response.statusText}`)
  }

  const tasks = await response.json()
  
  return tasks.map((task: any) => ({
    id: task.id,
    title: task.content,
    description: task.description,
    dueDate: task.due?.date,
    status: task.completed ? 'COMPLETED' : 'TODO',
    url: task.url,
    priority: task.priority
  }))
}

async function fetchAsanaTasks() {
  const response = await fetch(
    `${ASANA_API_URL}/tasks?workspace=${config.ASANA_WORKSPACE_GID}&assignee=me&opt_fields=name,notes,due_on,completed,permalink_url`, 
    {
      headers: {
        'Authorization': `Bearer ${config.ASANA_ACCESS_TOKEN}`,
        'Accept': 'application/json'
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Asana API error: ${response.statusText}`)
  }

  const data = await response.json()
  
  return data.data.map((task: any) => ({
    id: task.gid,
    title: task.name,
    description: task.notes,
    dueDate: task.due_on,
    status: task.completed ? 'COMPLETED' : 'TODO',
    url: task.permalink_url
  }))
}

// Get all tasks
taskRouter.get('/', async (c) => {
  try {
    const [todoistTasks, asanaTasks] = await Promise.all([
      fetchTodoistTasks().catch(error => {
        console.error('Todoist fetch error:', error)
        return []
      }),
      fetchAsanaTasks().catch(error => {
        console.error('Asana fetch error:', error)
        return []
      })
    ])
    
    return c.json({
      todoistTasks,
      asanaTasks
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
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