import dotenv from 'dotenv'
import { z } from 'zod'

// Load environment variables from .env file
dotenv.config()

// Define a schema for environment variables
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    DATABASE_URL: z.string(),
    ANTHROPIC_API_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    LEONARDOAI_API_KEY: z.string(),
    X_API_KEY: z.string(),
    LOG_LEVEL: z.string(),
    TODOIST_API_KEY: z.string().default(''),
    ASANA_ACCESS_TOKEN: z.string().default(''),
    ASANA_WORKSPACE_GID: z.string().default(''),
    GITHUB_ACCESS_TOKEN: z.string().default(''),
    STRAVA_CLIENT_ID: z.string(),
    STRAVA_CLIENT_SECRET: z.string(),
    STRAVA_REFRESH_TOKEN: z.string(),
})

// Parse and validate environment variables
const env = envSchema.safeParse(process.env)

if (!env.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(env.error.format(), null, 4))
    process.exit(1)
}

export const config = env.data