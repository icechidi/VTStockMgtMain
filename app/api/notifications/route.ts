// app/api/notifications/route.ts
import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { query } from "@/lib/database" // your existing helper that returns { rows, ... }

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

type NotificationRow = {
  id: string
  title: string
  message: string
  type: string
  created_at: string | Date
  read_at: string | null
  user_id?: string | null
  meta?: any
}

export async function GET(request: NextRequest) {
  try {
    // token: Authorization header "Bearer ..." or cookie "auth_token"
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("auth_token")?.value

    if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 })

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = decoded.userId ?? decoded.id ?? null

    // Query notifications intended for this user OR global (user_id IS NULL)
    const sql = `
      SELECT id, title, message, type, created_at, read_at, user_id, meta
      FROM notifications
      WHERE (user_id = $1 OR user_id IS NULL)
      ORDER BY created_at DESC
      LIMIT 50
    `
    const result = await query(sql, [userId])

    const rows = (result.rows ?? []) as NotificationRow[]

    const notifications = rows.map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      type: r.type,
      timestamp: new Date(r.created_at).toISOString(),
      read: r.read_at !== null,
      meta: r.meta ?? null,
    }))

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications", details: (error as any)?.message ?? String(error) },
      { status: 500 },
    )
  }
}
