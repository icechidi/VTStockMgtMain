import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function GET() {
  try {
    const result = await query("SELECT NOW() AS current_time;");
    return NextResponse.json({
      status: "ok",
      databaseTime: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json(
      { status: "error", message: "Database connection failed" },
      { status: 500 }
    );
  }
}
