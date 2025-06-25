import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        sm.id,
        si.name as item_name,
        sm.movement_type,
        sm.quantity,
        sm.movement_date
      FROM stock_movements sm
      JOIN stock_items si ON sm.item_id = si.id
      ORDER BY sm.movement_date DESC, sm.created_at DESC
      LIMIT 10
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch recent movements" }, { status: 500 })
  }
}
