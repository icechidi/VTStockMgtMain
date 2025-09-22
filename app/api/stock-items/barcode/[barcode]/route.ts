import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { barcode: string } }) {
  try {
    const { barcode } = params

    const result = await query(
      `
      SELECT si.*, 
             c.name as category_name,
             sc.name as subcategory_name,
             l.name as location_name,
             l.code as location_code,
             u.name as created_by_name
      FROM stock_items si
      LEFT JOIN categories c ON si.category_id = c.id
      LEFT JOIN subcategories sc ON si.subcategory_id = sc.id
      LEFT JOIN locations l ON si.location_id = l.id
      LEFT JOIN users u ON si.created_by = u.id
      WHERE si.barcode = $1
    `,
      [barcode],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching item by barcode:", error)
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 })
  }
}
