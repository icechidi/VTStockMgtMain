import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const userResult = await query("SELECT id FROM users WHERE email = $1 AND status = 'active'", [email.toLowerCase()])

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return NextResponse.json({ message: "If the email exists, a reset code has been sent" })
    }

    const userId = userResult.rows[0].id

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store reset code in database
    await query(
      `INSERT INTO password_reset_codes (user_id, code, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET code = $2, expires_at = $3, created_at = NOW()`,
      [userId, resetCode, expiresAt],
    )

    // In a real application, you would send an email here
    console.log(`Password reset code for ${email}: ${resetCode}`)

    return NextResponse.json({ message: "If the email exists, a reset code has been sent" })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
