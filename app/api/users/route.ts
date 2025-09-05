import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT u.*, l.name as location_name, l.code as location_code
      FROM users u
      LEFT JOIN locations l ON u.location_id = l.id
      ORDER BY u.name
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      email,
      role = "employee",
      status = "active",
      location_id,
      phone,
      department,
      join_date,
    } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const result = await query(
      `
      INSERT INTO users (name, email, role, status, location_id, phone, department, join_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [name, email, role, status, location_id, phone, department, join_date],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
