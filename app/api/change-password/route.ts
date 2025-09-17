// app/api/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // app-dir compatible
import bcrypt from "bcryptjs";

import { query } from "@/lib/database";
import authOptions from "@/lib/auth";

type JsonBody = { currentPassword?: string; newPassword?: string };



export async function POST(req: NextRequest) {
  try {
    // 1) Validate session
    const session = await getServerSession(authOptions as any) as { user?: { id?: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2) Parse body
    const body = (await req.json()) as JsonBody;
    const { currentPassword, newPassword } = body ?? {};

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be a string and at least 8 characters long" },
        { status: 400 }
      );
    }

    // 3) Read DB row
    const res = await query("SELECT password, must_change_password FROM users WHERE id = $1 AND status = 'active'", [
      userId,
    ]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "User not found or not active" }, { status: 404 });
    }
    const dbUser = res.rows[0];
    const mustChange = Boolean(dbUser.must_change_password);

    // 4) Decide whether to verify currentPassword:
    //    - If user was forced to change (must_change_password === true) we allow change without currentPassword.
    //    - Otherwise we require currentPassword and verify it against dbUser.password.
    if (!mustChange) {
      if (!currentPassword || typeof currentPassword !== "string") {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      const ok = await bcrypt.compare(currentPassword, dbUser.password);
      if (!ok) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }

    // 5) Hash new password and update row (clear must_change_password)
    const hashed = await bcrypt.hash(newPassword, 12);
    await query(
      "UPDATE users SET password = $1, must_change_password = false, updated_at = NOW() WHERE id = $2",
      [hashed, userId]
    );

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("change-password route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
