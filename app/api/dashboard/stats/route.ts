import { NextResponse } from "next/server"
import { query } from "@/lib/database"

// Each stat is queried independently and defaults to 0 on failure, so a
// single missing/misconfigured table (e.g. `repairs` not yet migrated on a
// given database) can't take down the entire dashboard -- which is what was
// happening before: Promise.all() fails fast on the first rejection, so one
// broken query zeroed out every other (working) stat too.
async function safeCount(sql: string, label: string): Promise<number> {
  try {
    const result = await query(sql)
    return Number(result.rows[0]?.count ?? 0)
  } catch (error) {
    console.error(`[dashboard/stats] "${label}" query failed (defaulting to 0):`, (error as Error).message)
    return 0
  }
}

async function safeValue(sql: string, label: string): Promise<number> {
  try {
    const result = await query(sql)
    return Number(result.rows[0]?.total_value ?? 0)
  } catch (error) {
    console.error(`[dashboard/stats] "${label}" query failed (defaulting to 0):`, (error as Error).message)
    return 0
  }
}

export async function GET() {
  const [totalItems, repairItems, lowStockItems, totalValue, recentMovements] = await Promise.all([
    safeCount(`SELECT COUNT(*)::int AS count FROM stock_items WHERE is_active = true`, "totalItems"),
    safeCount(`SELECT COUNT(*)::int AS count FROM repairs WHERE status IN ('pending', 'in_progress')`, "repairItems"),
    safeCount(
      `SELECT COUNT(*)::int AS count FROM stock_items WHERE is_active = true AND quantity <= min_quantity`,
      "lowStockItems",
    ),
    safeValue(
      `SELECT COALESCE(SUM(quantity * unit_price), 0)::float AS total_value FROM stock_items WHERE is_active = true`,
      "totalValue",
    ),
    safeCount(
      `SELECT COUNT(*)::int AS count FROM stock_movements WHERE movement_date >= CURRENT_DATE - INTERVAL '7 days'`,
      "recentMovements",
    ),
  ])

  return NextResponse.json({
    totalItems,
    repairItems,
    lowStockItems,
    totalValue,
    recentMovements,
  })
}
