import {Hono} from "hono";
import { bearerAuth } from 'hono/bearer-auth'
import chatRouter from "./chat/chat";
import taskRouter from "./tasks/tasks";
import {config} from "../../config.env";
import { cors } from 'hono/cors'

const apiRouter = new Hono()
apiRouter.use('/*', cors({
    origin: ['http://localhost:8080', 'https://localhost:8080', "https://apiprimemrckdev-production.up.railway.app", "https://prime.mrck.dev"], // Add your frontend URL
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true
  }))


const token = config.X_API_KEY

apiRouter.use('/*', bearerAuth({token}))

apiRouter.route('/chat', chatRouter)
apiRouter.route('/tasks', taskRouter)
apiRouter.get('/resource', (c) => c.json({ message: 'Protected resource' }))

export default apiRouter