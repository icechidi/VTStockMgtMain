import { NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query(
      `UPDATE repairs 
       SET status = 'returned', returned_date = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Repair not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error marking repair as returned:", error)
    return NextResponse.json({ error: "Failed to mark repair as returned" }, { status: 500 })
  }
}
