import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const { currentPassword, newPassword } = await request.json()

    // Get user
    const userResult = await query("SELECT * FROM users WHERE id = $1", [decoded.userId])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userResult.rows[0]

    // For demo purposes, validate current password
    const validCurrentPassword = await validateCurrentPassword(currentPassword, user.email)

    if (!validCurrentPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      hashedPassword,
      decoded.userId,
    ])

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}

// Demo password validation - replace with proper bcrypt comparison in production
async function validateCurrentPassword(password: string, email: string): Promise<boolean> {
  const demoCredentials = {
    "admin@company.com": "admin123",
    "jane@company.com": "manager123",
    "mike@company.com": "employee123",
    "sarah@company.com": "manager123",
    "david@company.com": "employee123",
  }

  return demoCredentials[email as keyof typeof demoCredentials] === password
}
