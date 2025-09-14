import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, code, and new password are required" }, { status: 400 })
    }

    // Verify reset code and get user
    const result = await query(
      `SELECT u.id FROM password_reset_codes prc
       JOIN users u ON prc.user_id = u.id
       WHERE u.email = $1 AND prc.code = $2 AND prc.expires_at > NOW()`,
      [email.toLowerCase(), code],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }

    const userId = result.rows[0].id

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password and delete reset code
    await query("BEGIN")

    await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hashedPassword, userId])

    await query("DELETE FROM password_reset_codes WHERE user_id = $1", [userId])

    await query("COMMIT")

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    await query("ROLLBACK")
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
