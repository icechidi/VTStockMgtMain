"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight } from "lucide-react"

export function LowStockBanner() {
  const [lowStockItems, setLowStockItems] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.lowStockItems === "number") {
          setLowStockItems(data.lowStockItems)
        }
      })
      .catch((err) => console.error("Error fetching low stock count:", err))
  }, [])

  if (!lowStockItems || lowStockItems <= 0) return null

  return (
    <Link
      href="/stocks?status=low-stock"
      className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm no-underline transition-colors hover:bg-warning/15 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-2 text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          <strong className="font-semibold">{lowStockItems} item{lowStockItems === 1 ? "" : "s"}</strong>{" "}
          <span className="text-foreground/80">
            {lowStockItems === 1 ? "is" : "are"} below minimum stock threshold. Review and restock to avoid
            disruption.
          </span>
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-warning">
        View Alerts <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  )
}
