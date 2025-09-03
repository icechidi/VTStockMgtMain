import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function GET() {
  try {
    // Check DB connection
    const result = await query("SELECT NOW() AS current_time;");

    return NextResponse.json({
      status: "ok",
      server: "running",
      database: {
        status: "connected",
        time: result.rows[0].current_time,
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
          status: "disconnected",
          error: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
