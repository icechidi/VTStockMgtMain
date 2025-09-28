import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const action = searchParams.get("action")
    const entityType = searchParams.get("entity_type")
    const userId = searchParams.get("user_id")
    const date = searchParams.get("date")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramCount = 0

    if (search) {
      paramCount++
      whereClause += ` AND (al.description ILIKE $${paramCount} OR al.entity_name ILIKE $${paramCount} OR u.name ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    if (action && action !== "all") {
      paramCount++
      whereClause += ` AND al.action = $${paramCount}`
      params.push(action)
    }

    if (entityType && entityType !== "all") {
      paramCount++
      whereClause += ` AND al.entity_type = $${paramCount}`
      params.push(entityType)
    }

    if (userId && userId !== "all") {
      paramCount++
      whereClause += ` AND al.user_id = $${paramCount}`
      params.push(userId)
    }

    if (date && date !== "all") {
      paramCount++
      let dateCondition = ""
      switch (date) {
        case "today":
          dateCondition = "al.created_at >= CURRENT_DATE"
          break
        case "week":
          dateCondition = "al.created_at >= CURRENT_DATE - INTERVAL '7 days'"
          break
        case "month":
          dateCondition = "al.created_at >= CURRENT_DATE - INTERVAL '30 days'"
          break
      }
      if (dateCondition) {
        whereClause += ` AND ${dateCondition}`
      }
    }

    // Get total count
    const countResult = await query(
      `
      SELECT COUNT(*) as total
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `,
      params,
    )

    // Get logs with pagination
    paramCount += 2
    const result = await query(
      `
      SELECT al.*, u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `,
      [...params, limit, offset],
    )

    return NextResponse.json({
      logs: result.rows,
      total: Number.parseInt(countResult.rows[0].total),
    })
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}
