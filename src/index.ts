import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { config } from './config.env'
import {authMiddleware} from "./middleware/auth";
import chatRouter from './routes/chat/chat'


const app = new Hono()

app.route('/chat', chatRouter)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/test', (c) => {
  return c.json({ message: 'Message man!. Hello Hono!' })
})

// Usage in your Hono app
app.use('/protected/*', authMiddleware)
app.get('/protected/resource', (c) => c.json({ message: 'Protected resource' }))

const port = parseInt(config.PORT) || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
