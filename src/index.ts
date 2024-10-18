import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { config } from './config.env'
import apiRouter from './routes/api'
import {pinoLogger} from "./middleware/pino-logger";


const app = new Hono()
app.use(logger())
app.use(pinoLogger());

app.route('/api', apiRouter)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/test', (c) => {
  return c.json({ message: 'Message man!. Hello Hono!' })
})

export type AppType = typeof app

const port = parseInt(config.PORT) || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})


