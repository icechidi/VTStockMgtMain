import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    // Get total items
    const totalItemsResult = await query(`
      SELECT COUNT(*) as count FROM stock_items WHERE is_active = true
    `)

    // Get low stock items
    const lowStockResult = await query(`
      SELECT COUNT(*) as count FROM stock_items 
      WHERE is_active = true AND quantity <= min_quantity
    `)

    // Get total value
    const totalValueResult = await query(`
      SELECT SUM(quantity * unit_price) as total_value 
      FROM stock_items WHERE is_active = true
    `)

    // Get recent movements (last 7 days)
    const recentMovementsResult = await query(`
      SELECT COUNT(*) as count FROM stock_movements 
      WHERE movement_date >= CURRENT_DATE - INTERVAL '7 days'
    `)

    const stats = {
      totalItems: Number.parseInt(totalItemsResult.rows[0].count),
      lowStockItems: Number.parseInt(lowStockResult.rows[0].count),
      totalValue: Number.parseFloat(totalValueResult.rows[0].total_value || 0),
      recentMovements: Number.parseInt(recentMovementsResult.rows[0].count),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
