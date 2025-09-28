import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (search) {
      paramCount++
      whereClause += ` AND (s.name ILIKE $${paramCount} OR s.code ILIKE $${paramCount} OR s.contact_person ILIKE $${paramCount} OR s.email ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    if (status && status !== "all") {
      paramCount++
      whereClause += ` AND s.status = $${paramCount}`
      params.push(status)
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
      ${whereClause}
      GROUP BY s.id, u.name
      ORDER BY s.name
    `,
      params,
    )

    return NextResponse.json({ suppliers: result.rows })
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      notes,
    } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const result = await query(
      `
      INSERT INTO suppliers (
        name, code, contact_person, email, phone, address, city, country,
        postal_code, tax_id, payment_terms, credit_limit, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        notes,
        session.user.id,
      ],
    )

    // Log activity
    await query(
      `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, description, new_values)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        session.user.id,
        "CREATE",
        "supplier",
        result.rows[0].id,
        name,
        `Created supplier: ${name} (${code})`,
        JSON.stringify(result.rows[0]),
      ],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating supplier:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Supplier code already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 })
  }
}
