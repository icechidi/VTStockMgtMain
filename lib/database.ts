// lib/database.ts
import { Pool } from "pg";

function ensureStringEnv(name: string): string {
  const v = process.env[name];
  // Only log type/length, never the actual secret
  console.log(
    `[env check] ${name}: type=${typeof v} ${
      v === undefined ? "(undefined)" : `(length=${String(v).length})`
    }`
  );
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (typeof v !== "string") {
    throw new Error(`${name} must be a string`);
  }
  return v;
}

// Prefer DATABASE_URL if present (bypasses individual DB_* vars)
const DATABASE_URL = process.env.DATABASE_URL;
let pool: Pool;

if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL });
  console.log("[db] Using DATABASE_URL");
} else {
  const DB_USER = ensureStringEnv("DB_USER");
  const DB_HOST = ensureStringEnv("DB_HOST");
  const DB_NAME = ensureStringEnv("DB_NAME");
  const DB_PASSWORD = ensureStringEnv("DB_PASSWORD"); // will throw if missing
  const DB_PORT = Number(process.env.DB_PORT ?? 5432);

  pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT,
  });
}

// Quick sanity check (won’t print secret)
(async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log("[db] Pool connection test: OK");
  } catch (err: any) {
    console.error("[db] Pool connection test: FAILED:", err?.message ?? err);
  }
})();

// Database query helper with timing + row count logging
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("[db] Executed query", { text, duration, rows: res.rowCount });
  return res;
}

// Get a client from the pool for transactions
export async function getClient() {
  return pool.connect();
}

export { pool };
