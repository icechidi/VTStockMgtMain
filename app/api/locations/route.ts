import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { logActivity } from "@/lib/activity-log"

export async function GET() {
  try {
    const result = await query(`
      SELECT l.*, 
             COUNT(si.id) as item_count,
             COALESCE(SUM(si.quantity * si.unit_price), 0) as total_value
      FROM locations l
      LEFT JOIN stock_items si ON l.id = si.location_id
      GROUP BY l.id
      ORDER BY l.name
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      name,
      code,
      block,
      type = "storage_room",
      status = "active",
      capacity = 0,
      manager,
      description,
      address,
      city,
      country,
      phone,
      email,
    } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const result = await query(
      `
      INSERT INTO locations (name, code, block, type, status, capacity, manager, description, address, city, country, phone, email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
      [name, code, block, type, status, capacity, manager, description, address, city, country, phone, email],
    )

    await logActivity({
      userId: (session.user as { id?: string }).id,
      userName: (session.user as { name?: string }).name,
      action: "CREATE",
      entityType: "location",
      entityId: result.rows[0].id,
      entityName: name,
      description: `Created location: ${name} (${code})`,
      newValues: result.rows[0],
    })

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating location:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Location code already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
