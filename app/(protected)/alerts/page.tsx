// app/(protected)/alerts/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, AlertTriangle, XCircle, AlertCircle } from "lucide-react"

type AlertSeverity = "out_of_stock" | "critical" | "low_stock"

interface StockAlert {
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

interface AlertsSummary {
  total: number
  out_of_stock: number
  critical: number
  low_stock: number
}

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; icon: typeof AlertTriangle; badgeClass: string; cardClass: string }
> = {
  out_of_stock: {
    label: "Out of Stock",
    icon: XCircle,
    badgeClass: "bg-destructive text-destructive-foreground hover:bg-destructive",
    cardClass: "border-destructive/30",
  },
  critical: {
    label: "Critical",
    icon: AlertCircle,
    badgeClass: "bg-warning text-warning-foreground hover:bg-warning",
    cardClass: "border-warning/30",
  },
  low_stock: {
    label: "Low Stock",
    icon: AlertTriangle,
    badgeClass: "bg-info text-info-foreground hover:bg-info",
    cardClass: "border-info/30",
  },
}

const FILTERS: Array<{ key: "all" | AlertSeverity; label: string }> = [
  { key: "all", label: "All" },
  { key: "out_of_stock", label: "Out of Stock" },
  { key: "critical", label: "Critical" },
  { key: "low_stock", label: "Low Stock" },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [summary, setSummary] = useState<AlertsSummary | null>(null)
  const [filter, setFilter] = useState<"all" | AlertSeverity>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/alerts")
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Failed to load alerts (${res.status})`)
      setAlerts(data.alerts ?? [])
      setSummary(data.summary ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Alerts</h1>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["out_of_stock", "critical", "low_stock"] as AlertSeverity[]).map((sev) => {
          const cfg = SEVERITY_CONFIG[sev]
          const Icon = cfg.icon
          return (
            <Card key={sev} className={cfg.cardClass}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{cfg.label}</p>
                  <p className="mt-1 text-xl font-bold tracking-tight">
                    {summary ? summary[sev] : loading ? "…" : 0}
                  </p>
                </div>
                <Icon className="h-6 w-6 text-muted-foreground" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">
            Stock Alerts {summary ? `(${summary.total})` : ""}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={filter === f.key ? "default" : "outline"}
                className="h-7 px-2.5 text-xs"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading && <p className="py-8 text-center text-sm text-muted-foreground">Loading alerts...</p>}
          {error && <p className="py-8 text-center text-sm text-destructive">Failed to load alerts: {error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-success" />
              {alerts.length === 0 ? "All items are well stocked!" : "No alerts match this filter."}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((alert) => {
                const cfg = SEVERITY_CONFIG[alert.severity]
                return (
                  <div key={alert.id} className={`flex flex-col justify-between rounded-lg border p-3 ${cfg.cardClass}`}>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium">{alert.name}</p>
                        <Badge className={`shrink-0 ${cfg.badgeClass}`}>{cfg.label}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Current: {alert.quantity} | Min: {alert.min_quantity}
                        {alert.location ? ` | ${alert.location}` : ""}
                      </p>
                      {alert.category && <p className="text-xs text-muted-foreground">{alert.category}</p>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link href={`/stocks?search=${encodeURIComponent(alert.name)}`} className="flex-1">
                        <Button variant="outline" size="sm" className="h-7 w-full text-xs bg-transparent">
                          View
                        </Button>
                      </Link>
                      <Link href={`/movements/new?item=${alert.item_id}`} className="flex-1">
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
    </div>
  )
}
