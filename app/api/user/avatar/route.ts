// app/api/user/avatar/route.ts
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route" // adjust path if your authOptions live elsewhere
import { query } from "@/lib/database"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars")
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  } catch (err) {
    // ignore
  }
}

function extFromMime(mime: string) {
  switch (mime) {
    case "image/png":
      return ".png"
    case "image/webp":
      return ".webp"
    case "image/gif":
      return ".gif"
    case "image/jpeg":
    default:
      return ".jpg"
  }
}

/**
 * List of candidate user-table columns that may hold avatar URL.
 * If your users table uses a different column name, add it here,
 * or create a migration so one of these names exists.
 */
const CANDIDATE_AVATAR_COLUMNS = [
  "avatar",
  "avatar_url",
  "image_url",
  "image",
  "picture",
  "photo",
]

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get("avatar") as File | null
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded under 'avatar' field" }, { status: 400 })
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    const MAX_BYTES = 5 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    await ensureUploadDir()

    // preserve extension if provided, else infer from mime
    let ext = path.extname(String((file as any).name || "")).toLowerCase()
    if (!ext) ext = extFromMime(file.type)

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fs.writeFile(filepath, buffer)

    const imageUrl = `/uploads/avatars/${filename}`

    // Determine user identifier (prefer id, fallback to email)
    const userId = (session.user as any).id
    const userEmail = (session.user as any).email

    let updatedRow: any = null
    try {
      // Check which avatar-like column exists in users table
      const colRes = await query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'users'
           AND column_name = ANY($1::text[])
         ORDER BY array_position($1::text[], column_name) NULLS LAST
         LIMIT 1`,
        [CANDIDATE_AVATAR_COLUMNS],
      )

      const foundCol = colRes.rows?.[0]?.column_name as string | undefined

      if (foundCol) {
        // safe because foundCol is one of our whitelisted candidate names
        if (userId) {
          const upd = await query(
            // note: returning the column normalized as "avatar" to simplify client handling
            `UPDATE users SET ${foundCol} = $1 WHERE id = $2 RETURNING id, ${foundCol} AS avatar`,
            [imageUrl, userId],
          )
          updatedRow = upd.rows?.[0] ?? null
        } else if (userEmail) {
          const upd = await query(
            `UPDATE users SET ${foundCol} = $1 WHERE email = $2 RETURNING id, ${foundCol} AS avatar`,
            [imageUrl, userEmail],
          )
          updatedRow = upd.rows?.[0] ?? null
        } else {
          console.warn("[avatar] session has no id or email; skipping DB update")
        }
      } else {
        // no avatar column exists — do not fail, return imageUrl so client can preview
        console.warn(
          "[avatar] no avatar-like column found on users table. Create one (avatar/avatar_url/image) to persist.",
        )
      }
    } catch (err) {
      // If the update fails for any reason, log and continue — we still return imageUrl
      console.error("Avatar DB update error:", err)
    }

    // Return imageUrl and any DB-updated row (if available)
    return NextResponse.json({ imageUrl, user: updatedRow }, { status: 200 })
  } catch (err: any) {
    console.error("Avatar upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
