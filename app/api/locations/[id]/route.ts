import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const data = await request.json()

    const fields = [
      "name", "code", "block", "type", "status", "capacity",
      "manager", "description", "address", "city", "country", "phone", "email"
    ]
    const updates = []
    const values = []
    let idx = 1

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${idx++}`)
        values.push(data[field])
      }
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }
    values.push(id)

    const result = await query(
      `UPDATE locations SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}