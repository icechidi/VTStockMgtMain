import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { name, category_id, description } = await request.json()

    if (!name || !category_id) {
      return NextResponse.json({ error: "Name and category_id are required" }, { status: 400 })
    }

    const result = await query(
      "INSERT INTO subcategories (name, category_id, description) VALUES ($1, $2, $3) RETURNING *",
      [name, category_id, description],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating subcategory:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Subcategory name already exists in this category" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 })
  }
}
