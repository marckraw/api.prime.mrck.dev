import { Context, Next } from 'hono'

const authMiddleware = async (c: Context, next: Next) => {
    console.log("This is middleware!")
    const apiKey = c.req.header('X-API-Key')

    if (!apiKey || !isValidApiKey(apiKey)) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    await next()
}

function isValidApiKey(apiKey: string): boolean {
    return apiKey === process.env.X_API_KEY
}

export { authMiddleware }