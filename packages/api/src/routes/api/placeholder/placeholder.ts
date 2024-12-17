import { Hono } from 'hono'

const placeholderRouter = new Hono()

// Get all issues
placeholderRouter.get('/', async (c) => {
  try {
    const formattedPlaceholder = [
      {
        name: "Task Management",
        value: "project_tracking"
      },
      {
        name: "User Authentication", 
        value: "auth_system"
      },
      {
        name: "Data Analytics",
        value: "analytics_dashboard"
      },
      {
        name: "File Storage",
        value: "cloud_storage"
      },
      {
        name: "Message System",
        value: "notifications"
      }
    ]
    

    return c.json({ placeholder: formattedPlaceholder })
  } catch (error) {
    console.error('Error fetching issues:', error)
    return c.json({ error: 'Failed to fetch issues' }, 500)
  }
})

export default placeholderRouter