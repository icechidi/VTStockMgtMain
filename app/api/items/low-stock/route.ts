import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(
      `
      SELECT 
        id,
        name,
        quantity,
        min_quantity
      FROM stock_items
      WHERE is_active = true
        AND quantity <= min_quantity
      ORDER BY quantity ASC, name ASC
      `
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Database error (low-stock):", error)
    return NextResponse.json(
      { error: "Failed to fetch low stock items" },
      { status: 500 }
    )
  }
}
