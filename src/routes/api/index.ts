import {Hono} from "hono";
import { bearerAuth } from 'hono/bearer-auth'
import chatRouter from "../chat/chat";
import {config} from "../../config.env";

const apiRouter = new Hono()

const token = config.X_API_KEY

apiRouter.use('/*', bearerAuth({token}))

apiRouter.route('/chat', chatRouter)
apiRouter.get('/resource', (c) => c.json({ message: 'Protected resource' }))

export default apiRouter