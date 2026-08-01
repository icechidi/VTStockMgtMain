import { NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logActivity } from "@/lib/activity-log"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query("SELECT * FROM repairs WHERE id = $1", [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Repair not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching repair:", error)
    return NextResponse.json({ error: "Failed to fetch repair" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { item_name, description, issue_description, status, priority, assigned_to, notes } = await request.json()

    const result = await query(
      `UPDATE repairs 
       SET item_name = $1, description = $2, issue_description = $3, status = $4, priority = $5, assigned_to = $6, notes = $7,
           returned_date = CASE WHEN $4 = 'returned' AND returned_date IS NULL THEN NOW() ELSE returned_date END,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [item_name, description, issue_description, status, priority, assigned_to, notes, params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Repair not found" }, { status: 404 })
    }

    await logActivity({
      userId: (session.user as { id?: string })?.id,
      userName: (session.user as { name?: string })?.name,
      action: "UPDATE",
      entityType: "repair",
      entityId: params.id,
      entityName: item_name,
      description: `Updated repair for ${item_name} (status: ${status})`,
      newValues: result.rows[0],
    })

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating repair:", error)
    return NextResponse.json({ error: "Failed to update repair" }, { status: 500 })
  }
}
