"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

type AlertSeverity = "out_of_stock" | "critical" | "low_stock"

interface StockAlert {
  id: string
  item_id: string
  name: string
  location?: string | null
  quantity: number
  min_quantity: number
  severity: AlertSeverity
}

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; badgeClass: string }> = {
  out_of_stock: { label: "Out of Stock", badgeClass: "bg-destructive text-destructive-foreground hover:bg-destructive" },
  critical: { label: "Critical", badgeClass: "bg-warning text-warning-foreground hover:bg-warning" },
  low_stock: { label: "Low Stock", badgeClass: "bg-info text-info-foreground hover:bg-info" },
}

export function LowStockAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/alerts")
      .then((res) => res.json())
      .then((data) => {
        setAlerts((data.alerts ?? []).slice(0, 6))
        setTotal(data.summary?.total ?? (data.alerts ?? []).length)
      })
      .catch((err) => console.error("Error fetching alerts:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    // Fixed height matches QuickActions (its sibling in the same grid row) so
    // both cards line up evenly regardless of how many alerts/actions exist.
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <CardTitle className="text-sm font-semibold">Low Stock Alerts {total > 0 && `(${total})`}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Link href="/stocks?status=low-stock">
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs bg-transparent">
              Manage Inventory
            </Button>
          </Link>
          <Link href="/alerts">
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs bg-transparent">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-7 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-success" />
            All items are well stocked!
          </div>
        ) : (
          <div className="thin-scrollbar grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {alerts.map((item) => {
              const cfg = SEVERITY_CONFIG[item.severity]
              return (
                <div key={item.id} className="flex flex-col justify-between rounded-lg border p-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="line-clamp-2 text-sm font-medium">{item.name}</div>
                      <Badge className={`shrink-0 text-[10px] ${cfg.badgeClass}`}>{cfg.label}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Current: {item.quantity} | Min: {item.min_quantity}
                      {item.location && ` | ${item.location}`}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/stocks?search=${encodeURIComponent(item.name)}`} className="flex-1">
                      <Button variant="outline" size="sm" className="h-7 w-full text-xs bg-transparent">
                        View
                      </Button>
                    </Link>
                    <Link href={`/movements/new?item=${item.item_id}`} className="flex-1">
                      <Button size="sm" className="h-7 w-full text-xs">
                        Restock
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
