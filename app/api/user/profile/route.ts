import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions, pool } from "@/lib/auth"
import { logActivity } from "@/lib/activity-log"

async function hasImageColumn(): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'image' LIMIT 1`,
    )
    return result.rows.length > 0
  } catch {
    return false
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string; name?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, phone, department } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // The `image` column was missing on some deployments of this schema
    // (added via scripts/08-phase4-fixes.sql). Check for it dynamically so
    // this route works whether or not that migration has been run yet,
    // instead of crashing with "column image does not exist".
    const imageColumnExists = await hasImageColumn()
    const returningCols = imageColumnExists
      ? "id, name, email, phone, department, role, image"
      : "id, name, email, phone, department, role"

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, phone = $3, department = $4, updated_at = NOW()
       WHERE id = $5 AND status = 'active'
       RETURNING ${returningCols}`,
      [name, email.toLowerCase(), phone, department, session.user.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await logActivity({
      userId: session.user.id,
      userName: name ?? session.user.name,
      action: "UPDATE",
      entityType: "user_profile",
      entityId: session.user.id,
      description: `${name ?? "User"} updated their profile`,
    })

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
