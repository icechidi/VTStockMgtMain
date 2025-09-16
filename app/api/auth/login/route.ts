// app/login/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body?.email ?? "").toString();
    const password = (body?.password ?? "").toString();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Find user by email (don't filter out non-active here if you want to handle specific statuses)
    const result = await query(
      `SELECT u.*, l.name as location_name, l.code as location_code
       FROM users u
       LEFT JOIN locations l ON u.location_id = l.id
       WHERE lower(u.email) = lower($1)`,
      [email],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = result.rows[0];

    // Detect stored bcrypt hash, preferring `password` column
    const bcryptRegex = /^\$2[aby]\$/;
    let storedHash: string | null = null;

    if (typeof user.password === "string" && bcryptRegex.test(user.password)) {
      storedHash = user.password;
    } else if (typeof user.password_hash === "string" && bcryptRegex.test(user.password_hash)) {
      // secondary fallback if you still have password_hash column populated
      storedHash = user.password_hash;
    } else {
      // final generic fallback: scan any string column to find a bcrypt-like hash
      for (const key of Object.keys(user)) {
        const val = user[key];
        if (typeof val === "string" && bcryptRegex.test(val)) {
          storedHash = val;
          break;
        }
      }
    }

    // Verify password
    let validPassword = false;
    if (storedHash) {
      validPassword = await bcrypt.compare(password, storedHash);
    } else {
      // Fallback to demo credentials for development (remove in production)
      validPassword = await validateDemoPassword(password, user.email);
    }

    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Optional: require 'active' status
    if (user.status && user.status !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }

    // Update last login
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Remove sensitive data before returning
    const { password: _pw, password_hash: _pwHash, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      user: userWithoutPassword,
      token,
    });

    // Set HTTP-only cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Demo password validation for development — remove or disable in production
async function validateDemoPassword(password: string, email: string): Promise<boolean> {
  const demoCredentials: Record<string, string> = {
    "admin@company.com": "admin123",
    "jane@company.com": "manager123",
    "mike@company.com": "employee123",
    "sarah@company.com": "manager123",
    "david@company.com": "employee123",
  };

  return demoCredentials[email] === password;
}
