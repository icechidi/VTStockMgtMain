import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { logActivity } from "@/lib/activity-log"

export async function GET() {
  try {
    const categoriesResult = await query(`
      SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
             json_agg(
               json_build_object(
                 'id', s.id,
                 'name', s.name,
                 'description', s.description
               ) ORDER BY s.name
             ) FILTER (WHERE s.id IS NOT NULL) as subcategories
      FROM categories c
      LEFT JOIN subcategories s ON c.id = s.category_id
      GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
      ORDER BY c.name
    `)

    interface Subcategory {
        id: number;
        name: string;
        description: string;
    }

    interface CategoryRow {
        id: number;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        subcategories: Subcategory[] | null;
    }

    const categories = categoriesResult.rows.map((row: CategoryRow) => ({
        ...row,
        subcategories: row.subcategories || [],
    }));

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const result = await query("INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *", [
      name,
      description,
    ])

    await logActivity({
      userId: (session.user as { id?: string }).id,
      userName: (session.user as { name?: string }).name,
      action: "CREATE",
      entityType: "category",
      entityId: result.rows[0].id,
      entityName: name,
      description: `Created category: ${name}`,
      newValues: result.rows[0],
    })

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating category:", error)
    if (error.code === "23505") {
      // Unique violation
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
