// app/api/user/avatar/route.ts
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { NextResponse } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    // ignore
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded under 'avatar' field" }, { status: 400 });
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    await ensureUploadDir();

    const ext = file.name.includes(".") ? path.extname(file.name) : (file.type === "image/png" ? ".png" : ".jpg");
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filepath, buffer);

    const imageUrl = `/uploads/avatars/${filename}`;
    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (err: any) {
    console.error("Avatar upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
