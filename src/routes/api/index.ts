import {Hono} from "hono";
import { bearerAuth } from 'hono/bearer-auth'
import chatRouter from "./chat/chat";
import {config} from "../../config.env";
import { cors } from 'hono/cors'

const apiRouter = new Hono()
apiRouter.use(
    '/*',
    cors({
        origin: ['https://example.com', 'https://example.org'],
    })
)

const token = config.X_API_KEY

apiRouter.use('/*', bearerAuth({token}))

apiRouter.route('/chat', chatRouter)
apiRouter.get('/resource', (c) => c.json({ message: 'Protected resource' }))

export default apiRouter