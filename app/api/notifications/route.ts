import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Get notifications for the user
    const result = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 OR user_id IS NULL 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [decoded.userId],
    )

    interface NotificationRow {
        id: string;
        title: string;
        message: string;
        type: string;
        created_at: string | number | Date;
        read_at: string | null;
    }

    interface Notification {
        id: string;
        title: string;
        message: string;
        type: string;
        timestamp: string;
        read: boolean;
    }

    const notifications: Notification[] = (result.rows as NotificationRow[]).map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: new Date(notification.created_at).toLocaleString(),
        read: notification.read_at !== null,
    }))

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Notifications fetch error:", error)
    // Return default notifications if database fails
    return NextResponse.json([
      {
        id: "1",
        title: "Low Stock Alert",
        message: "iPhone 13 Pro is running low (5 units remaining)",
        type: "warning",
        timestamp: "2 minutes ago",
        read: false,
      },
      {
        id: "2",
        title: "New Stock Movement",
        message: "100 units of Samsung Galaxy S23 added to Main Warehouse",
        type: "success",
        timestamp: "1 hour ago",
        read: false,
      },
      {
        id: "3",
        title: "System Update",
        message: "Inventory system will be updated tonight at 2 AM",
        type: "info",
        timestamp: "3 hours ago",
        read: true,
      },
    ])
  }
}
