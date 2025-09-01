import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "week"

    let chartData = []
    let dateFormat = ""
    let interval = ""

    switch (timeframe) {
      case "week":
        dateFormat = "Day"
        interval = "7 days"
        break
      case "month":
        dateFormat = "Week"
        interval = "30 days"
        break
      case "quarter":
        dateFormat = "Month"
        interval = "90 days"
        break
      default:
        dateFormat = "Day"
        interval = "7 days"
    }

    const result = await query(`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${interval}',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date as date
      ),
      movements_by_date AS (
        SELECT 
          DATE(movement_date) as movement_date,
          movement_type,
          SUM(quantity) as total_quantity
        FROM stock_movements
        WHERE movement_date >= CURRENT_DATE - INTERVAL '${interval}'
        GROUP BY DATE(movement_date), movement_type
      )
      SELECT 
        ds.date,
        TO_CHAR(ds.date, 'Dy') as day,
        COALESCE(stock_in.total_quantity, 0) as stock_in,
        COALESCE(stock_out.total_quantity, 0) as stock_out
      FROM date_series ds
      LEFT JOIN movements_by_date stock_in ON ds.date = stock_in.movement_date AND stock_in.movement_type = 'IN'
      LEFT JOIN movements_by_date stock_out ON ds.date = stock_out.movement_date AND stock_out.movement_type = 'OUT'
      ORDER BY ds.date
    `)

    interface ChartRow {
      day: string
      stock_in: string | number
      stock_out: string | number
    }

    interface ChartData {
      day: string
      stockIn: number
      stockOut: number
    }

    chartData = (result.rows as ChartRow[]).map((row): ChartData => ({
      day: row.day,
      stockIn: Number.parseInt(row.stock_in as string),
      stockOut: Number.parseInt(row.stock_out as string),
    }))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 })
  }
}
