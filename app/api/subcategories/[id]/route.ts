import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const result = await query("DELETE FROM subcategories WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Subcategory deleted successfully" })
  } catch (error) {
    console.error("Error deleting subcategory:", error)
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 })
  }
}
