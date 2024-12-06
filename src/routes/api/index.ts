import { Hono } from "hono";
import { bearerAuth } from 'hono/bearer-auth'
import chatRouter from "./chat/chat";
import taskRouter from "./tasks/tasks";
import imageRouter from "./images/images";
import aiDevs from "./ai_devs/aiDevs";
import googleRouter from './google/dupa'
import issueRouter from "./issues/issues";
import stravaRouter from "./strava/strava";
import habitRouter from "./habits/habits";
import userRouter from "./users/users";
import aiRouter from "./ai/ai";
import { config } from "../../config.env";

const apiRouter = new Hono()

const token = config.X_API_KEY

apiRouter.use('/*', bearerAuth({ token }))

 // Routes
apiRouter.route('/chat', chatRouter)
apiRouter.route('/ai', aiRouter)
apiRouter.route('/images', imageRouter)
apiRouter.route('/tasks', taskRouter)
apiRouter.route('/issues', issueRouter)
apiRouter.route('/habits', habitRouter)
apiRouter.route('/ai_devs', aiDevs)   
apiRouter.route('/strava', stravaRouter)
apiRouter.route('/google', googleRouter)
apiRouter.route('/users', userRouter)
apiRouter.get('/resource', (c) => c.json({ message: 'Protected resource' }))

export default apiRouter
