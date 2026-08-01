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

    const { name, description } = await request.json()
    const { id } = params

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const result = await query("UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *", [
      name,
      description,
      id,
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    await logActivity({
      userId: (session.user as { id?: string }).id,
      userName: (session.user as { name?: string }).name,
      action: "UPDATE",
      entityType: "category",
      entityId: id,
      entityName: name,
      description: `Updated category: ${name}`,
      newValues: result.rows[0],
    })

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("Error updating category:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check for items still assigned to this category first, so we return a
    // clear, actionable error instead of a raw FK-constraint 500.
    const inUse = await query("SELECT COUNT(*)::int AS count FROM stock_items WHERE category_id = $1", [id])
    if (Number(inUse.rows[0]?.count ?? 0) > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${inUse.rows[0].count} item(s) still use this category. Reassign them first.` },
        { status: 409 },
      )
    }

    const result = await query("DELETE FROM categories WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    await logActivity({
      userId: (session.user as { id?: string }).id,
      userName: (session.user as { name?: string }).name,
      action: "DELETE",
      entityType: "category",
      entityId: id,
      entityName: result.rows[0].name,
      description: `Deleted category: ${result.rows[0].name}`,
      oldValues: result.rows[0],
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
