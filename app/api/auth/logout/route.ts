// app/api/auth/logout/route.ts
import { NextResponse } from "next/server"
import { serialize } from "cookie"

export async function POST() {
  const expired = serialize("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return NextResponse.json({ ok: true }, { status: 200, headers: { "Set-Cookie": expired } })
}
