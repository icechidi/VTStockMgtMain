import { type NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await getClient()

  try {
    await client.query("BEGIN")

    const id = Number.parseInt(params.id)
    const body = await request.json()

    // Get current movement data
    const currentResult = await client.query("SELECT * FROM stock_movements WHERE id = $1", [id])

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: "Movement not found" }, { status: 404 })
    }

    const currentMovement = currentResult.rows[0]

    // Update movement (this will trigger the stock update via trigger)
    const updateFields = []
    const updateValues = []
    let paramCount = 1

    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && key !== "id") {
        updateFields.push(`${key} = $${paramCount}`)
        updateValues.push(value)
        paramCount++
      }
    })

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    updateValues.push(id)

    const updateQuery = `
      UPDATE stock_movements 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `

    await client.query(updateQuery, updateValues)
    await client.query("COMMIT")

    // Get the complete updated movement
    const movementResult = await query(
      `
      SELECT 
        sm.id,
        sm.item_id,
        si.name as item_name,
        sm.movement_type,
        sm.quantity,
        sm.unit_price,
        sm.total_value,
        sm.notes,
        sm.reference_number,
        sm.movement_date,
        sm.created_at,
        l.name as location,
        s.name as supplier,
        c.name as customer,
        u.full_name as user_name
      FROM stock_movements sm
      JOIN stock_items si ON sm.item_id = si.id
      LEFT JOIN locations l ON sm.location_id = l.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      LEFT JOIN customers c ON sm.customer_id = c.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE sm.id = $1
    `,
      [id],
    )

    return NextResponse.json(movementResult.rows[0])
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update movement" }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await getClient()

  try {
    await client.query("BEGIN")

    const id = Number.parseInt(params.id)

    const result = await client.query("DELETE FROM stock_movements WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Movement not found" }, { status: 404 })
    }

    await client.query("COMMIT")
    return NextResponse.json({ success: true })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete movement" }, { status: 500 })
  } finally {
    client.release()
  }
}
