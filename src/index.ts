import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { config } from './config.env'
import chatRouter from './routes/chat/chat'
import protectedRouter from './routes/protected'


const app = new Hono()
app.use(logger())

app.route('/chat', chatRouter)
app.route('/protected', protectedRouter)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/test', (c) => {
  return c.json({ message: 'Message man!. Hello Hono!' })
})

const port = parseInt(config.PORT) || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
