// src/db/index.ts

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Create a pool using your Railway connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required by Railway for secure connection
  },
});

// Pass the pool into Drizzle
export const db = drizzle(pool);

// Optional: export the pool too, in case you need raw SQL access somewhere
export { pool };
