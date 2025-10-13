import { type NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/database"

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeIdParam(rawId: string) {
  if (!rawId) return null
  // If it looks like a UUID, return it as-is
  if (UUID_V4_REGEX.test(rawId)) return rawId
  // If it's a plain integer string, parse to number
  if (/^\d+$/.test(rawId)) return Number.parseInt(rawId, 10)
  // Otherwise invalid
  return null
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await getClient()

  try {
    await client.query("BEGIN")

    const rawId = params.id
    const id = normalizeIdParam(rawId)

    if (id === null || id === undefined) {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "Invalid movement id" }, { status: 400 })
    }

    const body = await request.json()

    // Get current movement data (use the appropriate type for the id param)
    const currentResult = await client.query("SELECT * FROM stock_movements WHERE id = $1", [id])
    if (currentResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "Movement not found" }, { status: 404 })
    }

    // Build update statement from body keys
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramCount = 1

    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || key === "id") return

      // Defensive: if client sent sentinel values like "UNSPECIFIED", treat them as null
      // (You may prefer to handle this at client-side, but server-side guard is safe.)
      const sanitizedValue = value === "UNSPECIFIED" ? null : value

      updateFields.push(`${key} = $${paramCount}`)
      updateValues.push(sanitizedValue)
      paramCount++
    })

    if (updateFields.length === 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Add updated_at (no placeholder needed)
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    // Append id as last parameter for the WHERE clause
    updateValues.push(id)

    const updateQuery = `
      UPDATE stock_movements
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const updateResult = await client.query(updateQuery, updateValues)

    // If the update didn't return anything, treat as not found / something went wrong
    if (updateResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "Failed to update movement (no rows returned)" }, { status: 500 })
    }

    await client.query("COMMIT")

    // Re-select the full movement with joins (use helper `query` so you reuse your pool wrapper)
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

    if (!movementResult || movementResult.rows.length === 0) {
      // This is unexpected but handle gracefully
      return NextResponse.json(updateResult.rows[0])
    }

    return NextResponse.json(movementResult.rows[0])
  } catch (error) {
    try {
      await client.query("ROLLBACK")
    } catch (e) {
      // ignore
    }
    console.error("Database error in PUT /api/movements/[id]:", error)
    return NextResponse.json({ error: "Failed to update movement" }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await getClient()

  try {
    await client.query("BEGIN")

    const rawId = params.id
    const id = normalizeIdParam(rawId)

    if (id === null || id === undefined) {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "Invalid movement id" }, { status: 400 })
    }

    const result = await client.query("DELETE FROM stock_movements WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "Movement not found" }, { status: 404 })
    }

    await client.query("COMMIT")
    return NextResponse.json({ success: true })
  } catch (error) {
    try {
      await client.query("ROLLBACK")
    } catch (e) {
      // ignore
    }
    console.error("Database error in DELETE /api/movements/[id]:", error)
    return NextResponse.json({ error: "Failed to delete movement" }, { status: 500 })
  } finally {
    client.release()
  }
}
