import {Hono} from "hono";
import {authMiddleware} from "../../middleware/auth";
import chatRouter from "../chat/chat";

const apiRouter = new Hono()

apiRouter.use('/*', authMiddleware)
apiRouter.route('/chat', chatRouter)
apiRouter.get('/resource', (c) => c.json({ message: 'Protected resource' }))

export default apiRouter