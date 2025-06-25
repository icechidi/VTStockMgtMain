import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()
    const { name, description, category, unit_price, min_quantity, max_quantity, location } = body

    // Get category_id and location_id if provided
    let category_id = null
    let location_id = null

    if (category) {
      const categoryResult = await query("SELECT id FROM categories WHERE name = $1", [category])
      category_id = categoryResult.rows[0]?.id
    }

    if (location) {
      const locationResult = await query("SELECT id FROM locations WHERE name = $1", [location])
      location_id = locationResult.rows[0]?.id
    }

    // Update item
    const result = await query(
      `
      UPDATE stock_items 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        unit_price = COALESCE($4, unit_price),
        min_quantity = COALESCE($5, min_quantity),
        max_quantity = COALESCE($6, max_quantity),
        location_id = COALESCE($7, location_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `,
      [name, description, category_id, unit_price, min_quantity, max_quantity, location_id, id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Get the complete updated item
    const itemResult = await query(
      `
      SELECT 
        si.id,
        si.name,
        si.description,
        si.sku,
        si.unit_price,
        si.quantity,
        si.min_quantity,
        si.max_quantity,
        si.updated_at,
        c.name as category,
        l.name as location
      FROM stock_items si
      LEFT JOIN categories c ON si.category_id = c.id
      LEFT JOIN locations l ON si.location_id = l.id
      WHERE si.id = $1
    `,
      [id],
    )

    return NextResponse.json(itemResult.rows[0])
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    // Soft delete by setting is_active to false
    const result = await query("UPDATE stock_items SET is_active = false WHERE id = $1 RETURNING id", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}
