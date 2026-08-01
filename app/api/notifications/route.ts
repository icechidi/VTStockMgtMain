// app/api/notifications/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { query } from "@/lib/database"

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: string
  link?: string
}

// Real notifications derived from live data -- no separate notifications
// table to keep in sync, no fake/placeholder content. Combines:
//   1) Urgent stock alerts (out of stock / critical) computed live
//   2) Recent meaningful activity log entries (last 48h)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications: NotificationItem[] = []

    try {
      const alertRows = await query(
        `SELECT id, name, quantity, min_quantity
         FROM stock_items
         WHERE is_active = true AND min_quantity IS NOT NULL AND quantity <= min_quantity * 0.5
         ORDER BY quantity ASC
         LIMIT 5`,
      )
      for (const r of alertRows.rows) {
        const outOfStock = Number(r.quantity) <= 0
        notifications.push({
          id: `alert-${r.id}`,
          title: outOfStock ? "Out of Stock" : "Critical Stock Level",
          message: outOfStock
            ? `${r.name} is out of stock.`
            : `${r.name}: only ${r.quantity} left (min ${r.min_quantity}).`,
          type: outOfStock ? "error" : "warning",
          timestamp: new Date().toISOString(),
          link: `/stocks?search=${encodeURIComponent(r.name)}`,
        })
      }
    } catch (err) {
      console.error("[notifications] alert query failed:", err)
    }

    try {
      const activityRows = await query(
        `SELECT id, user_name, action, entity_type, entity_name, description, created_at
         FROM activity_logs
         WHERE created_at >= NOW() - INTERVAL '48 hours'
           AND action NOT IN ('LOGIN_FAILED')
         ORDER BY created_at DESC
         LIMIT 10`,
      )
      for (const r of activityRows.rows) {
        notifications.push({
          id: `activity-${r.id}`,
          title: activityTitle(r.action, r.entity_type),
          message: r.description ?? `${r.action} on ${r.entity_type}`,
          type: activityType(r.action),
          timestamp: new Date(r.created_at).toISOString(),
          link: "/activity-logs",
        })
      }
    } catch (err) {
      console.error("[notifications] activity query failed:", err)
    }

    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ notifications: notifications.slice(0, 20) })
  } catch (error) {
    console.error("Database error (/api/notifications):", error)
    return NextResponse.json({ error: "Failed to fetch notifications", notifications: [] }, { status: 500 })
  }
}

function activityTitle(action: string, entityType: string): string {
  const entity = (entityType ?? "item").replace(/_/g, " ")
  const cap = entity.charAt(0).toUpperCase() + entity.slice(1)
  switch (action) {
    case "CREATE":
      return `New ${entity} added`
    case "UPDATE":
      return `${cap} updated`
    case "DELETE":
      return `${cap} removed`
    case "LOGIN":
      return "User signed in"
    case "LOGOUT":
      return "User signed out"
    case "PASSWORD_CHANGE":
      return "Password changed"
    case "PASSWORD_RESET":
      return "Password reset"
    default:
      return action
  }
}

function activityType(action: string): NotificationItem["type"] {
  if (action === "DELETE") return "warning"
  if (action === "CREATE") return "success"
  return "info"
}
