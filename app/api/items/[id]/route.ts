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

    const { name, description, barcode, quantity, unit_price, min_quantity, category_id, subcategory_id, location_id } =
      await request.json()
    const { id } = params

    if (!name || quantity === undefined || unit_price === undefined) {
      return NextResponse.json({ error: "Name, quantity, and unit_price are required" }, { status: 400 })
    }

    const result = await query(
      `
      UPDATE stock_items 
      SET name = $1, description = $2, barcode = $3, quantity = $4, unit_price = $5, 
          min_quantity = $6, category_id = $7, subcategory_id = $8, location_id = $9,
          updated_at = NOW()
      WHERE id = $10 
      RETURNING *
    `,
      [name, description, barcode, quantity, unit_price, min_quantity, category_id, subcategory_id, location_id, id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 })
    }

    await logActivity({
      userId: (session.user as { id?: string }).id,
      userName: (session.user as { name?: string }).name,
      action: "UPDATE",
      entityType: "stock_item",
      entityId: id,
      entityName: name,
      description: `Updated stock item: ${name}`,
      newValues: result.rows[0],
    })

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("Error updating stock item:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Barcode already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update stock item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Soft delete: stock_movements.item_id has ON DELETE CASCADE, so a hard
    // DELETE here would silently wipe the item's entire movement history.
    // Flagging is_active = false instead preserves that audit trail while
    // still removing the item from normal views (the items GET route now
    // filters to is_active = true by default).
    const result = await query(
      "UPDATE stock_items SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 })
    }

    await logActivity({
      userId: (session.user as { id?: string }).id,
      userName: (session.user as { name?: string }).name,
      action: "DELETE",
      entityType: "stock_item",
      entityId: id,
      entityName: result.rows[0].name,
      description: `Removed stock item: ${result.rows[0].name}`,
      oldValues: result.rows[0],
    })

    return NextResponse.json({ message: "Stock item deleted successfully" })
  } catch (error) {
    console.error("Error deleting stock item:", error)
    return NextResponse.json({ error: "Failed to delete stock item" }, { status: 500 })
  }
}
