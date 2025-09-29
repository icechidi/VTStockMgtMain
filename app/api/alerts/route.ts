// app/api/alerts/route.ts
import { NextResponse } from "next/server"

import type { Pool } from "pg"

// Try to import your existing pool from '@/lib/db'.
// If not available, create a lightweight fallback pool here.
let pool: Pool | undefined = undefined
async function getPool(): Promise<Pool> {
  if (pool) return pool as Pool
  try {
    // prefer user's pool if present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const db = require("@/lib/db") // your repo may export `pool` from here
    if (db && db.pool) {
      pool = db.pool
      return pool as Pool
    }
    if (db && (db.default || db)) {
      // sometimes libs export directly
      const candidate = (db.default && db.default.pool) || db.default || db
      if (candidate && candidate.query) {
        pool = candidate
        return pool as Pool
      }
    }
  } catch (err) {
    // ignore — fallback to creating a pool below
  }

  // fallback: create a pool using environment vars (same as lib/db.ts)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool: PgPool } = require("pg")
  pool = new PgPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  })
  if (!pool) {
    throw new Error("Failed to initialize database pool")
  }
  return pool as Pool
}

type AlertItem = {
  id: string
  type: string
  title: string
  message?: string
  level?: "info" | "warning" | "error" | "success"
  created_at?: string
  meta?: Record<string, any>
}

export async function GET() {
  const alerts: AlertItem[] = []
  const warnings: string[] = []

  const p = await getPool()

  // Helper to run queries safely
  async function safeQuery<T = any>(sql: string, params: any[] = []) {
    try {
      const res = await p.query(sql, params)
      return res.rows as T[]
    } catch (err: any) {
      // record but continue
      warnings.push(`${err?.message || err?.toString()}`)
      return []
    }
  }

  // 1) Low stock items (quantity <= min_quantity)
  try {
    const lowStockRows = await safeQuery(
      `SELECT id, name, quantity, min_quantity, max_quantity
       FROM stock_items
       WHERE (min_quantity IS NOT NULL) AND quantity <= min_quantity
       ORDER BY quantity ASC
       LIMIT 50`
    )

    for (const r of lowStockRows) {
      alerts.push({
        id: `lowstock-${r.id}`,
        type: "low_stock",
        title: `Low stock: ${r.name}`,
        message: `Only ${r.quantity} left (min ${r.min_quantity}). Consider reordering.`,
        level: "warning",
        created_at: new Date().toISOString(),
        meta: { item_id: r.id, quantity: r.quantity, min_quantity: r.min_quantity, max_quantity: r.max_quantity },
      })
    }
  } catch (err) {
    // safeQuery already captures; continue
  }

  // 2) Recent movements (last 24 hours)
  try {
    const recentMovements = await safeQuery(
      `SELECT sm.id, sm.item_id, si.name AS item_name, sm.movement_type, sm.quantity, sm.total_value, sm.movement_date, u.name as user_name
       FROM stock_movements sm
       JOIN stock_items si ON sm.item_id = si.id
       LEFT JOIN users u ON sm.created_by = u.id
       WHERE sm.movement_date >= NOW() - INTERVAL '24 hours'
       ORDER BY sm.movement_date DESC
       LIMIT 50`
    )

    for (const m of recentMovements) {
      alerts.push({
        id: `mv-${m.id}`,
        type: "movement",
        title: `${m.movement_type} • ${m.item_name}`,
        message: `${m.quantity} ${m.movement_type === "IN" ? "received" : "removed"}${m.total_value ? ` — $${Number(m.total_value).toFixed(2)}` : ""} by ${m.user_name ?? "unknown"}`,
        level: "info",
        created_at: m.movement_date ? new Date(m.movement_date).toISOString() : new Date().toISOString(),
        meta: { movement_id: m.id, item_id: m.item_id },
      })
    }
  } catch (err) {}

  // 3) New suppliers (last 7 days)
  try {
    const newSuppliers = await safeQuery(
      `SELECT id, name, code, created_at
       FROM suppliers
       WHERE created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC
       LIMIT 20`
    )

    for (const s of newSuppliers) {
      alerts.push({
        id: `supplier-new-${s.id}`,
        type: "supplier_new",
        title: `New supplier: ${s.name}`,
        message: `Supplier ${s.name} was added${s.code ? ` (code ${s.code})` : ""}.`,
        level: "success",
        created_at: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(),
        meta: { supplier_id: s.id },
      })
    }
  } catch (err) {}

  // 4) Overstock items (quantity >= max_quantity)
  try {
    const overstock = await safeQuery(
      `SELECT id, name, quantity, max_quantity
       FROM stock_items
       WHERE (max_quantity IS NOT NULL) AND quantity >= max_quantity
       ORDER BY quantity DESC
       LIMIT 50`
    )

    for (const r of overstock) {
      alerts.push({
        id: `overstock-${r.id}`,
        type: "overstock",
        title: `Overstock: ${r.name}`,
        message: `${r.quantity} in stock (max ${r.max_quantity}).`,
        level: "info",
        created_at: new Date().toISOString(),
        meta: { item_id: r.id, quantity: r.quantity, max_quantity: r.max_quantity },
      })
    }
  } catch (err) {}

  // 5) Optional: pending reorders or failed movements (if table exists)
  try {
    // Example table names: stock_reorders, movement_errors — attempt to query if they exist
    const reorders = await safeQuery(
      `SELECT id, item_id, requested_qty, status, created_at
       FROM stock_reorders
       WHERE status = 'pending'
       ORDER BY created_at DESC
       LIMIT 50`
    )
    for (const r of reorders) {
      alerts.push({
        id: `reorder-${r.id}`,
        type: "reorder_pending",
        title: `Reorder requested`,
        message: `Item ${r.item_id} — ${r.requested_qty} (status: ${r.status})`,
        level: "info",
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      })
    }
  } catch (err) {
    // not critical
  }

  // 6) Append warnings about queries that failed (if any)
  for (const w of warnings) {
    alerts.push({
      id: `warn-${Math.random().toString(36).slice(2, 9)}`,
      type: "internal_warning",
      title: `Alert generation warning`,
      message: w,
      level: "warning",
      created_at: new Date().toISOString(),
    })
  }

  // sort by created_at desc (best-effort)
  alerts.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })

  return NextResponse.json({ alerts })
}
