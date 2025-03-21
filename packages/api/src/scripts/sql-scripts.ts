import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  await pool.query(`ALTER TABLE habits ADD COLUMN type TEXT DEFAULT 'boolean'`);
  console.log("✅ Column added successfully");
  await pool.end();
}

run().catch(console.error);
