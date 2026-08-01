// app/api/alerts/route.ts
import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export type AlertSeverity = "out_of_stock" | "critical" | "low_stock"

export interface StockAlert {
  id: string
  item_id: string
  name: string
  category?: string | null
  location?: string | null
  quantity: number
  min_quantity: number
  severity: AlertSeverity
  message: string
}

/**
 * Real, categorized stock alerts -- driven entirely by `quantity` and
 * `min_quantity` (both confirmed to exist on stock_items), so this never
 * depends on a `max_quantity` column that doesn't exist on this database.
 *
 * Tiers:
 *   out_of_stock -- quantity = 0
 *   critical     -- quantity > 0 and at or below half of min_quantity
 *   low_stock    -- quantity above that, but still at or below min_quantity
 */
export async function GET() {
  try {
    const result = await query(
      `SELECT si.id, si.name, si.quantity, si.min_quantity,
              c.name AS category, l.name AS location
       FROM stock_items si
       LEFT JOIN categories c ON si.category_id = c.id
       LEFT JOIN locations l ON si.location_id = l.id
       WHERE si.is_active = true
         AND si.min_quantity IS NOT NULL
         AND si.quantity <= si.min_quantity
       ORDER BY si.quantity ASC`,
    )

    const alerts: StockAlert[] = result.rows.map((r) => {
      const quantity = Number(r.quantity)
      const minQuantity = Number(r.min_quantity)
      let severity: AlertSeverity
      let message: string

      if (quantity <= 0) {
        severity = "out_of_stock"
        message = `${r.name} is out of stock.`
      } else if (quantity <= minQuantity * 0.5) {
        severity = "critical"
        message = `${r.name} is critically low: ${quantity} left (min ${minQuantity}).`
      } else {
        severity = "low_stock"
        message = `${r.name} is running low: ${quantity} left (min ${minQuantity}).`
      }

      return {
        id: String(r.id),
        item_id: String(r.id),
        name: r.name,
        category: r.category,
        location: r.location,
        quantity,
        min_quantity: minQuantity,
        severity,
        message,
      }
    })

    const summary = {
      total: alerts.length,
      out_of_stock: alerts.filter((a) => a.severity === "out_of_stock").length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      low_stock: alerts.filter((a) => a.severity === "low_stock").length,
    }

    return NextResponse.json({ alerts, summary })
  } catch (error) {
    console.error("Database error (/api/alerts):", error)
    return NextResponse.json({ error: "Failed to fetch alerts", alerts: [], summary: null }, { status: 500 })
  }
}
