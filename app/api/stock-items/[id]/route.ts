import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, description, barcode, quantity, unit_price, min_quantity, category_id, subcategory_id, location_id } =
      await request.json()
    const { id } = params

    if (!name || quantity === undefined || unit_price === undefined) {
      return NextResponse.json({ error: "Name, quantity, and unit_price are required" }, { status: 400 })
    }

    const result = await query(
      `
      UPDATE stock_items 
      SET name = $1, description = $2, barcode = $3, quantity = $4, unit_price = $5, 
          min_quantity = $6, category_id = $7, subcategory_id = $8, location_id = $9
      WHERE id = $10 
      RETURNING *
    `,
      [name, description, barcode, quantity, unit_price, min_quantity, category_id, subcategory_id, location_id, id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("Error updating stock item:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Barcode already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update stock item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const result = await query("DELETE FROM stock_items WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Stock item deleted successfully" })
  } catch (error) {
    console.error("Error deleting stock item:", error)
    return NextResponse.json({ error: "Failed to delete stock item" }, { status: 500 })
  }
}
