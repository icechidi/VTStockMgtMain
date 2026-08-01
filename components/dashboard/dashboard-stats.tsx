"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Package, AlertTriangle, TrendingUp, RefreshCw, Wrench } from "lucide-react"

interface StockStats {
  totalItems: number
  repairItems: number
  lowStockItems: number
  totalValue: number
  recentMovements: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<StockStats>({
    totalItems: 0,
    repairItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    recentMovements: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Items",
      value: stats.totalItems.toLocaleString(),
      icon: Package,
      color: "text-info",
      bg: "bg-info/10",
      href: "/stocks",
    },
    {
      title: "Repair Items",
      value: stats.repairItems.toLocaleString(),
      icon: Wrench,
      color: "text-success",
      bg: "bg-success/10",
      href: "/repairs",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems.toLocaleString(),
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
      href: "/stocks?status=low-stock",
    },
    {
      title: "Total Value",
      value: `$${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
      href: "/reports",
    },
    {
      title: "Recent Movements",
      value: stats.recentMovements.toLocaleString(),
      icon: RefreshCw,
      color: "text-[hsl(var(--chart-5))]",
      bg: "bg-[hsl(var(--chart-5))]/10",
      href: "/movements",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="h-6 w-10 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {statCards.map((card) => {
        const Icon = card.icon
        return (
          <Link key={card.title} href={card.href} className="block no-underline">
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-1 text-xl font-bold tracking-tight">{card.value}</p>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
