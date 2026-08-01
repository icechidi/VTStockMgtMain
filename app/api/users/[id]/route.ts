import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { logActivity } from "@/lib/activity-log"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, role, status, location_id, phone, department, join_date } = await request.json()
    const { id } = params

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const result = await query(
      `
      UPDATE users 
      SET name = $1, email = $2, role = $3, status = $4, location_id = $5, 
          phone = $6, department = $7, join_date = $8, updated_at = NOW()
      WHERE id = $9 
      RETURNING *
    `,
      [name, email, role, status, location_id, phone, department, join_date, id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await logActivity({
      userId: (session.user as { id?: string }).id,
      userName: (session.user as { name?: string }).name,
      action: "UPDATE",
      entityType: "user",
      entityId: id,
      entityName: name,
      description: `Updated user account: ${name}`,
      newValues: { name, email, role, status, department },
    })

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("Error updating user:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const currentUserId = (session.user as { id?: string }).id

    if (currentUserId === id) {
      return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 })
    }

    // Soft delete: a hard DELETE would hit FK constraints on any stock
    // items, movements, or activity log entries this user created (none of
    // those cascade), causing an unhandled 500. Deactivating via `status`
    // is also safer generally -- it preserves the audit trail and lets the
    // account be reactivated later instead of losing the record entirely.
    const result = await query(
      "UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await logActivity({
      userId: currentUserId,
      userName: (session.user as { name?: string }).name,
      action: "DELETE",
      entityType: "user",
      entityId: id,
      entityName: result.rows[0].name,
      description: `Deactivated user account: ${result.rows[0].name}`,
      oldValues: { status: "active" },
    })

    return NextResponse.json({ message: "User deactivated successfully" })
  } catch (error) {
    console.error("Error deactivating user:", error)
    return NextResponse.json({ error: "Failed to deactivate user" }, { status: 500 })
  }
}
