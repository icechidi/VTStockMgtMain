import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const { currentPassword, newPassword } = await request.json()

    // Get current user
    const userResult = await query("SELECT password_hash FROM users WHERE id = $1 AND status = 'active'", [
      decoded.userId,
    ])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      hashedPassword,
      decoded.userId,
    ])

    return NextResponse.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
