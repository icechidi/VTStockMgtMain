import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const result = await query("SELECT id, email, name FROM users WHERE email = $1 AND status = 'active'", [email])

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({ message: "If the email exists, a reset code has been sent." })
    }

    const user = result.rows[0]

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store reset code in database
    await query(
      `INSERT INTO password_reset_codes (user_id, email, code, expires_at) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) 
       DO UPDATE SET code = $3, expires_at = $4, created_at = NOW()`,
      [user.id, email, resetCode, expiresAt],
    )

    // In a real application, send email here
    console.log(`Password reset code for ${email}: ${resetCode}`)

    return NextResponse.json({
      message: "If the email exists, a reset code has been sent.",
      // For demo purposes, include the code in response
      resetCode: process.env.NODE_ENV === "development" ? resetCode : undefined,
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
