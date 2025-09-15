import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Mark notification as read
    await query(
      `UPDATE notifications 
       SET read_at = NOW() 
       WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [params.id, decoded.userId],
    )

    return NextResponse.json({ message: "Notification marked as read" })
  } catch (error) {
    console.error("Mark notification read error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
