import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Pool } from "pg"

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const action = searchParams.get("action")
    const entityType = searchParams.get("entity_type")
    const userId = searchParams.get("user_id")
    const dateFilter = searchParams.get("date")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const whereConditions = []
    const queryParams = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(
        al.description ILIKE $${paramIndex} OR 
        al.entity_name ILIKE $${paramIndex} OR
        al.user_name ILIKE $${paramIndex}
      )`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (action && action !== "all") {
      whereConditions.push(`al.action = $${paramIndex}`)
      queryParams.push(action)
      paramIndex++
    }

    if (entityType && entityType !== "all") {
      whereConditions.push(`al.entity_type = $${paramIndex}`)
      queryParams.push(entityType)
      paramIndex++
    }

    if (userId && userId !== "all") {
      whereConditions.push(`al.user_id = $${paramIndex}`)
      queryParams.push(userId)
      paramIndex++
    }

    if (dateFilter && dateFilter !== "all") {
      let dateCondition = ""
      const now = new Date()

      switch (dateFilter) {
        case "today":
          dateCondition = `al.created_at >= $${paramIndex} AND al.created_at < $${paramIndex + 1}`
          queryParams.push(new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
          queryParams.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString())
          paramIndex += 2
          break
        case "week":
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
          dateCondition = `al.created_at >= $${paramIndex}`
          queryParams.push(weekStart.toISOString())
          paramIndex++
          break
        case "month":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateCondition = `al.created_at >= $${paramIndex}`
          queryParams.push(monthStart.toISOString())
          paramIndex++
          break
      }

      if (dateCondition) {
        whereConditions.push(dateCondition)
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    const query = `
      SELECT al.*
      FROM activity_logs al
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const result = await pool.query(query, [...queryParams, limit, offset])

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs al
      ${whereClause}
    `
    const countResult = await pool.query(countQuery, queryParams)
    const total = Number.parseInt(countResult.rows[0].total)

    return NextResponse.json({
      logs: result.rows,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}
