import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT si.*, 
             l.name as location_name,
             l.code as location_code
      FROM stock_items si
      LEFT JOIN locations l ON si.location_id = l.id
      WHERE si.status IN ('low_stock', 'out_of_stock')
      ORDER BY si.status DESC, si.name
      LIMIT 20
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching low stock items:", error)
    return NextResponse.json({ error: "Failed to fetch low stock items" }, { status: 500 })
  }
}
