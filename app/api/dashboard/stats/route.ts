import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const [totalItemsResult, lowStockResult, totalValueResult, recentMovementsResult] =
      await Promise.all([
        query(`SELECT COUNT(*)::int AS count FROM stock_items WHERE is_active = true`),
        query(`SELECT COUNT(*)::int AS count FROM stock_items WHERE is_active = true AND quantity <= min_quantity`),
        query(`SELECT COALESCE(SUM(quantity * unit_price), 0)::float AS total_value FROM stock_items WHERE is_active = true`),
        query(`SELECT COUNT(*)::int AS count FROM stock_movements WHERE movement_date >= CURRENT_DATE - INTERVAL '7 days'`),
      ])

    const stats = {
      totalItems: totalItemsResult.rows[0].count,
      lowStockItems: lowStockResult.rows[0].count,
      totalValue: totalValueResult.rows[0].total_value,
      recentMovements: recentMovementsResult.rows[0].count,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Database error (/dashboard/stats):", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
