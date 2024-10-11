declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test'
            PORT?: string
            DATABASE_URL: string
            ANTHROPIC_API_KEY: string
        }
    }
}

export {}