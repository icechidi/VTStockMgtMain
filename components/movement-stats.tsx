// components/movement-stats.tsx
"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react"

interface StockMovement {
  id: number | string
  movement_type: "IN" | "OUT"
  quantity: number
  total_value?: number
  movement_date: string
}

interface MovementStatsProps {
  /** optional preloaded movements; if empty or undefined the component will fetch recent movements itself */
  movements?: StockMovement[]
  /** optional URL for fetch (useful for testing) */
  fetchUrl?: string
}

export function MovementStats({ movements: incomingMovements = [], fetchUrl = "/api/movements?limit=100" }: MovementStatsProps) {
  const [fetchedMovements, setFetchedMovements] = useState<StockMovement[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use incomingMovements if provided and non-empty; otherwise use fetchedMovements
  const effectiveMovements = useMemo(() => {
    if (Array.isArray(incomingMovements) && incomingMovements.length > 0) return incomingMovements
    if (Array.isArray(fetchedMovements)) return fetchedMovements
    return []
  }, [incomingMovements, fetchedMovements])

  useEffect(() => {
    // Only fetch if caller didn't provide data
    if (Array.isArray(incomingMovements) && incomingMovements.length > 0) return

    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(fetchUrl)
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
        const data = await res.json()
        // Expect server to return an array; if API returns {movements: [...]}, adapt
        let rows: any[] = []
        if (Array.isArray(data)) rows = data
        else if (Array.isArray((data as any).movements)) rows = (data as any).movements
        else if (Array.isArray((data as any).data)) rows = (data as any).data
        else rows = []

        // Normalize rows to StockMovement shape conservatively
        const normalized: StockMovement[] = rows.map((r: any) => ({
          id: r.id,
          movement_type: r.movement_type ?? r.type ?? "IN",
          quantity: Number.isFinite(Number(r.quantity)) ? Number(r.quantity) : 0,
          total_value: r.total_value === undefined || r.total_value === null ? undefined : Number(r.total_value),
          movement_date: r.movement_date ?? r.created_at ?? new Date().toISOString(),
        }))

        if (mounted) setFetchedMovements(normalized)
      } catch (err: any) {
        console.error("MovementStats fetch error:", err)
        if (mounted) setError(String(err?.message ?? err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [incomingMovements, fetchUrl])

  // date bounds for this month / last month
  const today = useMemo(() => new Date(), [])
  const thisMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today])
  const lastMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth() - 1, 1), [today])
  const nextMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 1), [today])

  const statsForPeriod = (list: StockMovement[]) => {
    const stockIn = list.filter((m) => m.movement_type === "IN")
    const stockOut = list.filter((m) => m.movement_type === "OUT")

    const totalMovements = list.length
    const stockInCount = stockIn.length
    const stockOutCount = stockOut.length
    const stockInQuantity = stockIn.reduce((s, m) => s + (Number.isFinite(Number(m.quantity)) ? Number(m.quantity) : 0), 0)
    const stockOutQuantity = stockOut.reduce((s, m) => s + (Number.isFinite(Number(m.quantity)) ? Number(m.quantity) : 0), 0)
    const totalValue = list.reduce((s, m) => s + (Number.isFinite(Number(m.total_value)) ? Number(m.total_value) : 0), 0)

    return {
      totalMovements,
      stockInCount,
      stockOutCount,
      stockInQuantity,
      stockOutQuantity,
      totalValue,
    }
  }

  const thisMonthMovements = useMemo(
    () => effectiveMovements.filter((m) => {
      const d = new Date(m.movement_date)
      return d >= thisMonthStart && d < nextMonthStart
    }),
    [effectiveMovements, thisMonthStart, nextMonthStart],
  )

  const lastMonthMovements = useMemo(
    () => effectiveMovements.filter((m) => {
      const d = new Date(m.movement_date)
      return d >= lastMonthStart && d < thisMonthStart
    }),
    [effectiveMovements, lastMonthStart, thisMonthStart],
  )

  const thisMonthStats = useMemo(() => statsForPeriod(thisMonthMovements), [thisMonthMovements])
  const lastMonthStats = useMemo(() => statsForPeriod(lastMonthMovements), [lastMonthMovements])

  const changePercent = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? 0 : 100
    return ((current - previous) / Math.abs(previous)) * 100
  }

  const stats = [
    {
      title: "Total Movements",
      value: thisMonthStats.totalMovements,
      change: changePercent(thisMonthStats.totalMovements, lastMonthStats.totalMovements),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Stock In",
      value: thisMonthStats.stockInQuantity,
      change: changePercent(thisMonthStats.stockInQuantity, lastMonthStats.stockInQuantity),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Stock Out",
      value: thisMonthStats.stockOutQuantity,
      change: changePercent(thisMonthStats.stockOutQuantity, lastMonthStats.stockOutQuantity),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Total Value",
      value: `$${(thisMonthStats.totalValue || 0).toFixed(2)}`,
      change: changePercent(thisMonthStats.totalValue || 0, lastMonthStats.totalValue || 0),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  // render loading/empty states gracefully
  if (loading) {
    return <div className="text-center py-6">Loading movement stats…</div>
  }

  if (error) {
    return <div className="text-center py-6 text-red-600">Failed to load movement stats: {error}</div>
  }

  if (effectiveMovements.length === 0) {
    return <div className="text-center py-6 text-muted-foreground">No movement data available</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className={stat.change >= 0 ? "text-green-600" : "text-red-600"}>
                {stat.change >= 0 ? "+" : ""}
                {Number(stat.change).toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default MovementStats
