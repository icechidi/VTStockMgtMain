import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function GET() {
  try {
    const result = await query("SELECT version();");

    return NextResponse.json({
      status: "ok",
      server: "running",
      database: {
        connected: true,
        version: result.rows[0].version,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        server: "running",
        database: {
          connected: false,
          error: (error as Error).message || "Database connection failed",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
