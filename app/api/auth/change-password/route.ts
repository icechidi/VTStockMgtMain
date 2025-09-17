// app/api/change-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import bcrypt from "bcryptjs"
import { query } from "@/lib/database"
import authOptions from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    // Fetch current user
    const result = await query("SELECT password FROM users WHERE id = $1 AND status = 'active'", [
      session.user.id,
    ])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = result.rows[0]

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and clear must_change_password if needed
    await query(
      "UPDATE users SET password = $1, must_change_password = false, updated_at = NOW() WHERE id = $2",
      [hashedPassword, session.user.id]
    )

    return NextResponse.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
