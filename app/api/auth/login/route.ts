import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const result = await query(
      `SELECT u.*, l.name as location_name, l.code as location_code
       FROM users u
       LEFT JOIN locations l ON u.location_id = l.id
       WHERE u.email = $1 AND u.status = 'active'`,
      [email],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const user = result.rows[0]

    // Verify password
    let validPassword = false

    if (user.password_hash) {
      // Use bcrypt for hashed passwords
      validPassword = await bcrypt.compare(password, user.password_hash)
    } else {
      // Fallback to demo credentials for development
      validPassword = await validateDemoPassword(password, user.email)
    }

    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Update last login
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id])

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    // Remove sensitive data
    const { password_hash, ...userWithoutPassword } = user

    const response = NextResponse.json({
      user: userWithoutPassword,
      token,
    })

    // Set HTTP-only cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Demo password validation for development
async function validateDemoPassword(password: string, email: string): Promise<boolean> {
  const demoCredentials = {
    "admin@company.com": "admin123",
    "jane@company.com": "manager123",
    "mike@company.com": "employee123",
    "sarah@company.com": "manager123",
    "david@company.com": "employee123",
  }

  return demoCredentials[email as keyof typeof demoCredentials] === password
}
