import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"
import bcrypt from "bcryptjs"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = rateLimit(`reset-password:${ip}`, 10, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  const { email, code, newPassword } = await request.json()

  if (!email || !code || !newPassword) {
    return NextResponse.json({ error: "Email, code, and new password are required" }, { status: 400 })
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  // Use a single dedicated client for the whole transaction. The previous
  // implementation ran BEGIN / UPDATE / DELETE / COMMIT as separate
  // pool.query() calls, each of which can be handed a *different* client
  // from the pool -- meaning the transaction was not actually atomic.
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const result = await client.query(
      `SELECT u.id FROM password_reset_codes prc
       JOIN users u ON prc.user_id = u.id
       WHERE u.email = $1 AND prc.code = $2 AND prc.expires_at > NOW()`,
      [email.toLowerCase(), code],
    )

    if (result.rows.length === 0) {
      await client.query("ROLLBACK")
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }

    const userId = result.rows[0].id
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      hashedPassword,
      userId,
    ])
    await client.query("DELETE FROM password_reset_codes WHERE user_id = $1", [userId])

    await client.query("COMMIT")

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    client.release()
  }
}
