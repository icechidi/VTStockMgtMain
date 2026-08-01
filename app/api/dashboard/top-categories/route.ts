import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT c.id, c.name, COUNT(si.id)::int AS item_count
      FROM categories c
      LEFT JOIN stock_items si ON si.category_id = c.id AND si.is_active = true
      GROUP BY c.id, c.name
      ORDER BY item_count DESC, c.name ASC
      LIMIT 5
    `)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Database error (/dashboard/top-categories):", error)
    return NextResponse.json({ error: "Failed to fetch top categories" }, { status: 500 })
  }
}
