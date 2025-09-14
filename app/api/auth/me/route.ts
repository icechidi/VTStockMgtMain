import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { query } from "@/lib/database"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userResult = await query("SELECT * FROM users WHERE id = $1 AND status = 'active'", [decoded.userId])
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const user = userResult.rows[0]
    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}