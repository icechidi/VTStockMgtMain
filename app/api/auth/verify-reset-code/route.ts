import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }

    // Verify reset code
    const result = await query(
      `SELECT prc.* FROM password_reset_codes prc
       JOIN users u ON prc.user_id = u.id
       WHERE u.email = $1 AND prc.code = $2 AND prc.expires_at > NOW()`,
      [email.toLowerCase(), code],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }

    return NextResponse.json({ message: "Reset code verified" })
  } catch (error) {
    console.error("Verify reset code error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
