import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        si.id,
        si.name,
        si.description,
        si.sku,
        si.barcode,
        si.unit_price,
        si.quantity,
        si.min_quantity,
        si.max_quantity,
        si.is_active,
        si.created_at,
        si.updated_at,
        c.name as category,
        l.name as location
      FROM stock_items si
      LEFT JOIN categories c ON si.category_id = c.id
      LEFT JOIN locations l ON si.location_id = l.id
      WHERE si.is_active = true
      ORDER BY si.name ASC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category, unit_price, quantity, min_quantity, max_quantity, location } = body

    // Get category_id and location_id
    const categoryResult = await query("SELECT id FROM categories WHERE name = $1", [category])

    const locationResult = await query("SELECT id FROM locations WHERE name = $1", [location])

    const category_id = categoryResult.rows[0]?.id
    const location_id = locationResult.rows[0]?.id

    // Generate SKU
    const skuResult = await query("SELECT generate_sku($1, $2) as sku", [category || "GEN", name])
    const sku = skuResult.rows[0].sku

    // Insert new item
    const result = await query(
      `
      INSERT INTO stock_items (
        name, description, sku, category_id, unit_price, 
        quantity, min_quantity, max_quantity, location_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        name,
        description,
        sku,
        category_id,
        unit_price,
        quantity,
        min_quantity,
        max_quantity,
        location_id,
        1, // Default user ID
      ],
    )

    // Get the complete item with joined data
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
        si.created_at,
        c.name as category,
        l.name as location
      FROM stock_items si
      LEFT JOIN categories c ON si.category_id = c.id
      LEFT JOIN locations l ON si.location_id = l.id
      WHERE si.id = $1
    `,
      [result.rows[0].id],
    )

    return NextResponse.json(itemResult.rows[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}
