import { type NextRequest, NextResponse } from "next/server"
import { query, getClient } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
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
      ORDER BY sm.movement_date DESC, sm.created_at DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch movements" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await getClient()

  try {
    await client.query("BEGIN")

    const body = await request.json()
    const {
      item_id,
      movement_type,
      quantity,
      unit_price,
      notes,
      reference_number,
      location,
      supplier,
      customer,
      movement_date,
    } = body

    // Check if we have enough stock for OUT movements
    if (movement_type === "OUT") {
      const stockCheck = await client.query("SELECT quantity FROM stock_items WHERE id = $1", [item_id])

      if (stockCheck.rows.length === 0) {
        throw new Error("Item not found")
      }

      if (stockCheck.rows[0].quantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${stockCheck.rows[0].quantity}, Requested: ${quantity}`)
      }
    }

    // Get location_id, supplier_id, customer_id
    let location_id = null
    let supplier_id = null
    let customer_id = null

    if (location) {
      const locationResult = await client.query("SELECT id FROM locations WHERE name = $1", [location])
      location_id = locationResult.rows[0]?.id
    }

    if (supplier) {
      const supplierResult = await client.query("SELECT id FROM suppliers WHERE name = $1", [supplier])
      supplier_id = supplierResult.rows[0]?.id
    }

    if (customer) {
      const customerResult = await client.query("SELECT id FROM customers WHERE name = $1", [customer])
      customer_id = customerResult.rows[0]?.id
    }

    // Calculate total value
    const total_value = unit_price ? quantity * unit_price : null

    // Insert movement
    const result = await client.query(
      `
      INSERT INTO stock_movements (
        item_id, movement_type, quantity, unit_price, total_value,
        notes, reference_number, location_id, supplier_id, customer_id,
        movement_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `,
      [
        item_id,
        movement_type,
        quantity,
        unit_price,
        total_value,
        notes,
        reference_number,
        location_id,
        supplier_id,
        customer_id,
        movement_date,
        1, // Default user ID
      ],
    )

    await client.query("COMMIT")

    // Get the complete movement with joined data
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
      [result.rows[0].id],
    )

    return NextResponse.json(movementResult.rows[0], { status: 201 })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Database error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create movement",
      },
      { status: 500 },
    )
  } finally {
    client.release()
  }
}
