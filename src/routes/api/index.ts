import { Hono } from "hono";
import { bearerAuth } from 'hono/bearer-auth'
import chatRouter from "./chat/chat";
import agiRouter from "./agi/agi";
import taskRouter from "./tasks/tasks";
import imageRouter from "./images/images";
import aiDevs from "./ai_devs/aiDevs";
import googleRouter from './google/dupa'
import { config } from "../../config.env";
import { cors } from 'hono/cors'
import issueRouter from "./issues/issues";

const apiRouter = new Hono()
apiRouter.use('/*', cors({
  origin: ['http://localhost:8080', 'https://localhost:8080', "https://apiprimemrckdev-production.up.railway.app", "https://prime.mrck.dev", "https://do-not-talk-about-this.vercel.app"], // Add your frontend URL
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true
}))


const token = config.X_API_KEY

apiRouter.use('/*', bearerAuth({ token }))

apiRouter.route('/chat', chatRouter)
apiRouter.route('/agi', agiRouter)
apiRouter.route('/images', imageRouter)
apiRouter.route('/tasks', taskRouter)
apiRouter.route('/issues', issueRouter)
apiRouter.route('/ai_devs', aiDevs)
apiRouter.route('/tasls', taskRouter)
apiRouter.route('/google', googleRouter)
apiRouter.get('/resource', (c) => c.json({ message: 'Protected resource' }))

export default apiRouter
