import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, code, block, type, status, capacity, manager, description, address, city, country, phone, email } =
      await request.json()
    const { id } = params

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const result = await query(
      `
      UPDATE locations 
      SET name = $1, code = $2, block = $3, type = $4, status = $5, capacity = $6, 
          manager = $7, description = $8, address = $9, city = $10, country = $11, 
          phone = $12, email = $13
      WHERE id = $14 
      RETURNING *
    `,
      [name, code, block, type, status, capacity, manager, description, address, city, country, phone, email, id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("Error updating location:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Location code already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Check if location has items
    const itemsCheck = await query("SELECT COUNT(*) as count FROM stock_items WHERE location_id = $1", [id])
    if (Number.parseInt(itemsCheck.rows[0].count) > 0) {
      return NextResponse.json({ error: "Cannot delete location with existing items" }, { status: 400 })
    }

    const result = await query("DELETE FROM locations WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Location deleted successfully" })
  } catch (error) {
    console.error("Error deleting location:", error)
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 })
  }
}
