import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
    const { id } = params

    const result = await query("DELETE FROM categories WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
