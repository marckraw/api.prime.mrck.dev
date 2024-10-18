import {Hono} from "hono";
import {authMiddleware} from "../../middleware/auth";


const protectedRouter = new Hono()


// Usage in your Hono app
protectedRouter.use('/*', authMiddleware)
protectedRouter.get('/resource', (c) => c.json({ message: 'Protected resource' }))

export default protectedRouter