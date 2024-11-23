import { Hono } from 'hono'
import { config } from '../../../config.env'
import { TodoistApi } from '@doist/todoist-api-typescript'

const taskRouter = new Hono()
const api = new TodoistApi(config.TODOIST_API_KEY)

async function fetchTodoistTasks() {
  try {
    const tasks = await api.getTasks()
    return tasks
  } catch (error) {
    console.error('Error fetching Todoist tasks:', error)
    throw error
  }
}

// Get all tasks
taskRouter.get('/', async (c) => {
  try {
    const tasks = await fetchTodoistTasks()
    return c.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// Get all today and overdue tasks
taskRouter.get('/today', async (c) => {
  try {
    const tasks = await fetchTodoistTasks()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayAndOverdueTasks = tasks.filter(task => {
      if (!task.due) return false
      const taskDate = new Date(task.due.date)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate <= today
    }).map(task => ({
      id: task.id,
      title: task.content,
      description: task.description,
      projectId: task.projectId,
      dueDate: task.due?.date,
      status: task.isCompleted ? 'COMPLETED' : 'TODO',
      url: task.url,
      priority: task.priority,
      labels: task.labels
    }))

    return c.json({ tasks: todayAndOverdueTasks, debug: { totalTasks: tasks.length, filteredTasks: todayAndOverdueTasks.length } })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// Get all tasks for this week
taskRouter.get('/this-week', async (c) => {
  try {
    const tasks = await fetchTodoistTasks()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get current day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const currentDay = today.getDay()
    
    // Calculate days to subtract to get to last Monday
    // If today is Sunday (0), we need to go back 6 days
    // If today is Monday (1), we need to go back 0 days
    // If today is Tuesday (2), we need to go back 1 day, etc
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1
    
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - daysToSubtract) // Start from Monday
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // End on Sunday
    endOfWeek.setHours(23, 59, 59, 999)

    const thisWeekTasks = tasks.filter(task => {
      if (!task.due) return false
      const taskDate = new Date(task.due.date)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate >= startOfWeek && taskDate <= endOfWeek
    }).map(task => ({
      id: task.id,
      title: task.content,
      description: task.description,
      projectId: task.projectId,
      dueDate: task.due?.date,
      status: task.isCompleted ? 'COMPLETED' : 'TODO',
      url: task.url,
      priority: task.priority,
      labels: task.labels
    }))

    return c.json({ 
      tasks: thisWeekTasks,
      debug: {
        weekStart: startOfWeek.toISOString(),
        weekEnd: endOfWeek.toISOString(),
        totalTasks: tasks.length,
        filteredTasks: thisWeekTasks.length
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// Get all tasks for next week
taskRouter.get('/next-week', async (c) => {
  try {
    const tasks = await fetchTodoistTasks()
    const today = new Date()
    
    const startOfNextWeek = new Date(today)
    startOfNextWeek.setDate(today.getDate() + (7 - today.getDay()))
    startOfNextWeek.setHours(0, 0, 0, 0)
    
    const endOfNextWeek = new Date(startOfNextWeek)
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6)
    endOfNextWeek.setHours(23, 59, 59, 999)

    const nextWeekTasks = tasks.filter(task => {
      if (!task.due) return false
      const taskDate = new Date(task.due.date)
      return taskDate >= startOfNextWeek && taskDate <= endOfNextWeek
    }).map(task => ({
      id: task.id,
      title: task.content,
      description: task.description,
      projectId: task.projectId,
      dueDate: task.due?.date,
      status: task.isCompleted ? 'COMPLETED' : 'TODO',
      url: task.url,
      priority: task.priority,
      labels: task.labels
    }))

    return c.json({ tasks: nextWeekTasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// Get single task
taskRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const task = await api.getTask(id)
    return c.json({ task })
  } catch (error) {
    console.error('Error fetching task:', error)
    return c.json({ error: 'Failed to fetch task' }, 500)
  }
})

// // Update task
// taskRouter.put('/:id', zValidator('json', updateTaskSchema), async (c) => {
//   try {
//     const id = c.req.param('id')
//     const data = await c.req.valid('json')
//     const task = await api.updateTask(id, {
//       content: data.title,
//       description: data.description,
//       dueDate: data.dueDate,
//       priority: data.priority
//     })
//     return c.json({ task })
//   } catch (error) {
//     console.error('Error updating task:', error)
//     return c.json({ error: 'Failed to update task' }, 500)
//   }
// })

export default taskRouter