import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const location = searchParams.get("location")
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (search) {
      paramCount++
      whereClause += ` AND (si.name ILIKE $${paramCount} OR si.description ILIKE $${paramCount} OR si.barcode ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    if (location && location !== "all") {
      paramCount++
      whereClause += ` AND l.code = $${paramCount}`
      params.push(location)
    }

    if (category && category !== "all") {
      paramCount++
      whereClause += ` AND c.name = $${paramCount}`
      params.push(category)
    }

    if (status && status !== "all") {
      paramCount++
      whereClause += ` AND si.status = $${paramCount}`
      params.push(status)
    }

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
      ${whereClause}
      ORDER BY si.name
    `,
      params,
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching stock items:", error)
    return NextResponse.json({ error: "Failed to fetch stock items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      description,
      barcode,
      quantity,
      unit_price,
      min_quantity,
      category_id,
      subcategory_id,
      location_id,
      created_by,
    } = await request.json()

    if (!name || quantity === undefined || unit_price === undefined) {
      return NextResponse.json({ error: "Name, quantity, and unit_price are required" }, { status: 400 })
    }

    // Generate barcode if not provided
    const finalBarcode = barcode || `BC${Date.now().toString().slice(-6)}`

    const result = await query(
      `
      INSERT INTO stock_items (name, description, barcode, quantity, unit_price, min_quantity, category_id, subcategory_id, location_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        name,
        description,
        finalBarcode,
        quantity,
        unit_price,
        min_quantity,
        category_id,
        subcategory_id,
        location_id,
        created_by,
      ],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating stock item:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Barcode already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create stock item" }, { status: 500 })
  }
}
