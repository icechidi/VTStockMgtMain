import { NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logActivity } from "@/lib/activity-log"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const priority = searchParams.get("priority") || ""

    let sql = "SELECT * FROM repairs WHERE 1=1"
    const params: any[] = []

    if (search) {
      sql +=
        " AND (item_name ILIKE $" + (params.length + 1) + " OR issue_description ILIKE $" + (params.length + 1) + ")"
      params.push(`%${search}%`)
    }

    if (status && status !== "all") {
      sql += " AND status = $" + (params.length + 1)
      params.push(status)
    }

    if (priority && priority !== "all") {
      sql += " AND priority = $" + (params.length + 1)
      params.push(priority)
    }

    sql += " ORDER BY created_at DESC"

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching repairs:", error)
    return NextResponse.json({ error: "Failed to fetch repairs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { item_name, description, issue_description, status, priority, assigned_to, notes } = await request.json()

    if (!item_name || !issue_description) {
      return NextResponse.json({ error: "item_name and issue_description are required" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO repairs (item_name, description, issue_description, status, priority, assigned_to, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [item_name, description, issue_description, status || "pending", priority || "medium", assigned_to, notes],
    )

    await logActivity({
      userId: (session.user as { id?: string })?.id,
      userName: (session.user as { name?: string })?.name,
      action: "CREATE",
      entityType: "repair",
      entityId: result.rows[0].id,
      entityName: item_name,
      description: `Logged repair for ${item_name}`,
      newValues: result.rows[0],
    })

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating repair:", error)
    return NextResponse.json({ error: "Failed to create repair" }, { status: 500 })
  }
}
