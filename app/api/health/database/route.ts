import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function GET() {
  try {
    // You can fetch DB version for more useful info
    const result = await query("SELECT version();");

    return NextResponse.json({
      connected: true,
      version: result.rows[0].version,
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json(
      {
        connected: false,
        error: (error as Error).message || "Database connection failed",
      },
      { status: 500 }
    );
  }
}
