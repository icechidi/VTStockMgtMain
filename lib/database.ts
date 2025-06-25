import { Pool } from "pg"

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "stock_management",
  password: process.env.DB_PASSWORD || "postgres",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
})

export { pool }

// Database query helper
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  console.log("Executed query", { text, duration, rows: res.rowCount })
  return res
}

// Get a client from the pool for transactions
export async function getClient() {
  const client = await pool.connect()
  return client
}
