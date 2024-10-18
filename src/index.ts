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

app.notFound((c) => {
  return c.json({ message: 'Not found', statusCode: 404 }, 404)
})

app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({message: 'Default Custom Internal server error', statusCode: 500}, 500)
})

export type AppType = typeof app

const port = parseInt(config.PORT) || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})


