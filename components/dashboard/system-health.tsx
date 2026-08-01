"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HealthMetric {
  label: string
  percent: number
  display: string
  color: string
}

export function SystemHealth() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)
  const [checkedAt, setCheckedAt] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const start = performance.now()
      let connected = false
      try {
        const res = await fetch("/api/health")
        connected = res.ok
      } catch {
        connected = false
      }
      const latencyMs = Math.round(performance.now() - start)

      let stats = { totalItems: 0, lowStockItems: 0 }
      let suppliers: { status: string }[] = []
      try {
        const [statsRes, suppliersRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/suppliers"),
        ])
        if (statsRes.ok) stats = await statsRes.json()
        if (suppliersRes.ok) {
          const data = await suppliersRes.json()
          suppliers = Array.isArray(data) ? data : (data?.suppliers ?? [])
        }
      } catch {
        // metrics below just degrade gracefully to 0
      }

      if (cancelled) return

      const stockHealthPct =
        stats.totalItems > 0 ? Math.round(((stats.totalItems - stats.lowStockItems) / stats.totalItems) * 100) : 100

      const activeSupplierPct =
        suppliers.length > 0
          ? Math.round((suppliers.filter((s) => s.status === "active").length / suppliers.length) * 100)
          : 0

      // Real, measured latency mapped to a 0-100 "responsiveness" bar (0ms = 100%, 800ms+ = 0%)
      const latencyPct = Math.max(0, Math.min(100, Math.round(100 - (latencyMs / 800) * 100)))

      setDbConnected(connected)
      setMetrics([
        {
          label: "Database",
          percent: connected ? 100 : 0,
          display: connected ? "Connected" : "Disconnected",
          color: connected ? "bg-success" : "bg-destructive",
        },
        {
          label: "API Response",
          percent: latencyPct,
          display: `${latencyMs}ms`,
          color: latencyPct > 60 ? "bg-success" : latencyPct > 30 ? "bg-warning" : "bg-destructive",
        },
        {
          label: "Stock Health",
          percent: stockHealthPct,
          display: `${stockHealthPct}%`,
          color: stockHealthPct > 80 ? "bg-success" : stockHealthPct > 50 ? "bg-warning" : "bg-destructive",
        },
        {
          label: "Active Suppliers",
          percent: activeSupplierPct,
          display: `${activeSupplierPct}%`,
          color: activeSupplierPct > 70 ? "bg-success" : "bg-warning",
        },
      ])
      setCheckedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
      setLoading(false)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const allGood = metrics.length > 0 && metrics.every((m) => m.percent >= 60)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">System Health</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-6 animate-pulse rounded bg-muted" />)
        ) : (
          <>
            {metrics.map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium">{m.display}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.percent}%` }} />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Last checked: {checkedAt}</span>
              <Badge
                variant="outline"
                className={allGood ? "border-success/30 text-success" : "border-warning/30 text-warning"}
              >
                {allGood ? "All Systems Go" : "Needs Attention"}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
