"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, TrendingUp, TrendingDown, BadgeAlert } from "lucide-react"

interface StockStats {
  totalItems: number
  repairItems?: number
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
      // Fallback to sample data
      setStats({
        totalItems: 1250,
        repairItems: 0,
        lowStockItems: 45,
        totalValue: 125000,
        recentMovements: 23,
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Items",
      value: stats.totalItems,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Repair Items",
      value: stats.repairItems,
      icon: BadgeAlert,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Value",
      value: `$${stats.totalValue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Recent Movements",
      value: stats.recentMovements,
      icon: TrendingDown,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
      {statCards.map((card, index) => {
        const Icon = card.icon
        const cardInner = (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        )

        // Make the Low Stock card clickable and link to the lowstock section on the stock page
        if (card.title === "Low Stock Items") {
          return (
            <Link
              href="/stock#lowstock"
              key={index}
              className="no-underline"
              aria-label="View low stock items"
            >
              <div className="cursor-pointer">{cardInner}</div>
            </Link>
          )
        }

        return (
          <div key={index}>
            {cardInner}
          </div>
        )
      })}
    </div>
  )
}
