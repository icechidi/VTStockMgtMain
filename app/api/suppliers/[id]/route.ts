import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query(
      `
      SELECT s.*, 
             u.name as created_by_name,
             COUNT(DISTINCT si.id) as items_count,
             COUNT(DISTINCT sm.id) as movements_count
      FROM suppliers s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN stock_items si ON s.id = si.supplier_id
      LEFT JOIN stock_movements sm ON s.id = sm.supplier_id
      WHERE s.id = $1
      GROUP BY s.id, u.name
    `,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching supplier:", error)
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get old values for logging
    const oldResult = await query("SELECT * FROM suppliers WHERE id = $1", [params.id])
    if (oldResult.rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }
    const oldValues = oldResult.rows[0]

    const {
      name,
      code,
      contact_person,
      email,
      phone,
      address,
      city,
      country,
      postal_code,
      tax_id,
      payment_terms,
      credit_limit,
      status,
      notes,
    } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const result = await query(
      `
      UPDATE suppliers SET
        name = $1, code = $2, contact_person = $3, email = $4, phone = $5,
        address = $6, city = $7, country = $8, postal_code = $9, tax_id = $10,
        payment_terms = $11, credit_limit = $12, status = $13, notes = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `,
      [
        name,
        code,
        contact_person,
        email,
        phone,
        address,
        city,
        country,
        postal_code,
        tax_id,
        payment_terms,
        credit_limit || 0,
        status,
        notes,
        params.id,
      ],
    )

    // Log activity
    await query(
      `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, description, old_values, new_values)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        session.user.id,
        "UPDATE",
        "supplier",
        params.id,
        name,
        `Updated supplier: ${name} (${code})`,
        JSON.stringify(oldValues),
        JSON.stringify(result.rows[0]),
      ],
    )

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("Error updating supplier:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Supplier code already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get supplier details for logging
    const supplierResult = await query("SELECT * FROM suppliers WHERE id = $1", [params.id])
    if (supplierResult.rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }
    const supplier = supplierResult.rows[0]

    // Check if supplier has associated items or movements
    const associatedResult = await query(
      `
      SELECT 
        COUNT(DISTINCT si.id) as items_count,
        COUNT(DISTINCT sm.id) as movements_count
      FROM suppliers s
      LEFT JOIN stock_items si ON s.id = si.supplier_id
      LEFT JOIN stock_movements sm ON s.id = sm.supplier_id
      WHERE s.id = $1
    `,
      [params.id],
    )

    const { items_count, movements_count } = associatedResult.rows[0]
    if (items_count > 0 || movements_count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete supplier. It has ${items_count} associated items and ${movements_count} movements. Consider setting status to inactive instead.`,
        },
        { status: 400 },
      )
    }

    await query("DELETE FROM suppliers WHERE id = $1", [params.id])

    // Log activity
    await query(
      `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, description, old_values)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        session.user.id,
        "DELETE",
        "supplier",
        params.id,
        supplier.name,
        `Deleted supplier: ${supplier.name} (${supplier.code})`,
        JSON.stringify(supplier),
      ],
    )

    return NextResponse.json({ message: "Supplier deleted successfully" })
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 })
  }
}
