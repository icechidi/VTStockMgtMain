import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import bcrypt from "bcrypt"

// Fetch all users
export async function GET() {
  try {
    const result = await query(`
      SELECT 
        u.id,
        COALESCE(u.name, '') AS name,
        COALESCE(u.email, '') AS email,
        COALESCE(u.department, '') AS department,
        COALESCE(u.role, '') AS role,
        COALESCE(u.status, '') AS status,
        COALESCE(u.phone, '') AS phone,
        u.location_id,
        COALESCE(l.name, '') AS location_name,
        COALESCE(l.code, '') AS location_code,
        u.join_date,
        u.created_at,
        u.updated_at
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


// Create a new user with one-time password
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
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }


    // 1. Generate OTP
    const oneTimePassword = Math.random().toString(36).slice(-8) // e.g. "f9k2jd0a"

    // 2. Hash OTP
    const passwordHash = await bcrypt.hash(oneTimePassword, 10)

    // 3. Insert user with password_hash + must_change_password = true
    const result = await query(
      `
      INSERT INTO users 
        (name, email, role, status, location_id, phone, department, join_date, password, must_change_password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING *
    `,
      [name, email, role, status, location_id, phone, department, join_date, passwordHash]
    )

    const newUser = result.rows[0]

    // 4. Return new user (minus sensitive hash) + OTP for admin
   
    return NextResponse.json(
      { user: newUser, oneTimePassword },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating user:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
