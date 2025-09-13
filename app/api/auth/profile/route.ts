import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const { name, email, phone, department } = await request.json()

    const result = await query(
      `UPDATE users 
       SET name = $1, email = $2, phone = $3, department = $4, updated_at = NOW()
       WHERE id = $5 AND status = 'active'
       RETURNING *`,
      [name, email.toLowerCase(), phone, department, decoded.userId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { password_hash, ...user } = result.rows[0]
    return NextResponse.json(user)
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
