// lib/database.ts
import { Pool, Client } from "pg";

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

/**
 * Normalize pool.options to ensure required types (especially password) are strings.
 * This prevents the pg client from receiving a non-string password which causes
 * the "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string" error.
 *
 * We keep this normalization minimal and non-destructive: cast to String only if value exists.
 */
try {
  if (pool && (pool as any).options) {
    const opts: any = (pool as any).options;
    if (opts.user !== undefined && typeof opts.user !== "string") opts.user = String(opts.user);
    if (opts.host !== undefined && typeof opts.host !== "string") opts.host = String(opts.host);
    if (opts.database !== undefined && typeof opts.database !== "string") opts.database = String(opts.database);
    if (opts.password !== undefined && typeof opts.password !== "string") opts.password = String(opts.password);
    if (opts.port !== undefined && typeof opts.port !== "number") {
      // try to coerce to number if possible
      const p = Number(opts.port);
      opts.port = Number.isNaN(p) ? opts.port : p;
    }
  }
} catch (err) {
  // don't block execution; log for debugging
  console.warn("[db] could not normalize pool.options:", err);
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

/**
 * Notifications helpers for LISTEN/NOTIFY
 *
 * Usage:
 *   const listener = await listenToNotifications("notifications_channel", (payload, channel) => {
 *     // payload is the string payload of the NOTIFY (left raw here)
 *   });
 *
 *   // later when done:
 *   await listener.close();
 *
 * Important notes:
 *  - This helper creates a dedicated pg Client (not a pooled query) because LISTEN
 *    requires a persistent connection.
 *  - Always call `close()` when you no longer need the listener to avoid leaking clients.
 *  - In production/serverless environments, long-lived connections may be problematic.
 *    Use this only on a server process capable of keeping a connection open (or use an
 *    external pub/sub).
 */

/**
 * listenToNotifications
 * - channel: the Postgres channel name to LISTEN on
 * - onNotification: (payload, channel, processId) => void
 *
 * Returns: { close(): Promise<void> } — call close when you're done.
 */
export async function listenToNotifications(
  channel: string,
  onNotification: (payload: string | null, channel: string, processId?: number) => void
) {
  // Copy pool.options into a fresh config object and normalize types (especially password)
  // so that Client gets correct typed values.
  const poolOpts: any = (pool as any).options || {};
  const clientConfig: any = { ...poolOpts };

  if (clientConfig.user !== undefined && typeof clientConfig.user !== "string") clientConfig.user = String(clientConfig.user);
  if (clientConfig.host !== undefined && typeof clientConfig.host !== "string") clientConfig.host = String(clientConfig.host);
  if (clientConfig.database !== undefined && typeof clientConfig.database !== "string")
    clientConfig.database = String(clientConfig.database);
  if (clientConfig.password !== undefined && typeof clientConfig.password !== "string")
    clientConfig.password = String(clientConfig.password);
  if (clientConfig.port !== undefined && typeof clientConfig.port !== "number") {
    const p = Number(clientConfig.port);
    if (!Number.isNaN(p)) clientConfig.port = p;
  }

  const client = new Client(clientConfig); // re-use pool config (normalized)
  await client.connect();

  // forward notifications
  const notificationHandler = (msg: { channel: string; payload: string | null; processId?: number }) => {
    try {
      onNotification(msg.payload, msg.channel, (msg as any).processId);
    } catch (err) {
      console.error("[db] notification handler threw:", err);
    }
  };

  client.addListener("notification", notificationHandler);

  try {
    await client.query(`LISTEN ${channel}`);
    console.log(`[db] Listening to channel: ${channel}`);
  } catch (err) {
    client.removeListener("notification", notificationHandler);
    await client.end();
    throw err;
  }

  let closed = false;

  return {
    /**
     * Close the listener: UNLISTEN <channel>, remove listener, and end client.
     */
    async close() {
      if (closed) return;
      closed = true;
      try {
        await client.query(`UNLISTEN ${channel}`);
      } catch (err) {
        // ignore errors on UNLISTEN
        console.warn("[db] UNLISTEN error:", err);
      }
      client.removeListener("notification", notificationHandler);
      try {
        await client.end();
      } catch (err) {
        console.warn("[db] error closing listener client:", err);
      }
      console.log(`[db] Stopped listening to channel: ${channel}`);
    },
  };
}

/**
 * notifyChannel - convenience wrapper for NOTIFY
 * - channel: the Postgres channel name
 * - payload: string or object (if object, we JSON.stringify it)
 *
 * Example:
 *   await notifyChannel('notifications_channel', { type: 'item_moved', item_id: 123 });
 */
export async function notifyChannel(channel: string, payload: unknown) {
  // Postgres NOTIFY payload must be a string; ensure we send a JSON-safe string
  const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
  // Use a single client from the pool for this query
  const start = Date.now();
  const res = await pool.query(`NOTIFY ${channel}, $1`, [payloadStr]);
  const duration = Date.now() - start;
  console.log("[db] NOTIFY", { channel, duration });
  return res;
}
