"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react"

interface StockMovement {
  id: number
  movement_type: "IN" | "OUT"
  quantity: number
  total_value?: number
  movement_date: string
}

interface MovementStatsProps {
  movements: StockMovement[]
}

export function MovementStats({ movements }: MovementStatsProps) {
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

  const thisMonthMovements = movements.filter((m) => new Date(m.movement_date) >= thisMonth)
  const lastMonthMovements = movements.filter(
    (m) => new Date(m.movement_date) >= lastMonth && new Date(m.movement_date) < thisMonth,
  )

  const calculateStats = (movementList: StockMovement[]) => {
    const stockIn = movementList.filter((m) => m.movement_type === "IN")
    const stockOut = movementList.filter((m) => m.movement_type === "OUT")

    return {
      totalMovements: movementList.length,
      stockInCount: stockIn.length,
      stockOutCount: stockOut.length,
      stockInQuantity: stockIn.reduce((sum, m) => sum + m.quantity, 0),
      stockOutQuantity: stockOut.reduce((sum, m) => sum + m.quantity, 0),
      totalValue: Number(movementList.reduce((sum, m) => sum + (m.total_value || 0), 0)) || 0,
    }
  }

  const thisMonthStats = calculateStats(thisMonthMovements)
  const lastMonthStats = calculateStats(lastMonthMovements)

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const stats = [
    {
      title: "Total Movements",
      value: thisMonthStats.totalMovements,
      change: calculatePercentageChange(thisMonthStats.totalMovements, lastMonthStats.totalMovements),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Stock In",
      value: thisMonthStats.stockInQuantity,
      change: calculatePercentageChange(thisMonthStats.stockInQuantity, lastMonthStats.stockInQuantity),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Stock Out",
      value: thisMonthStats.stockOutQuantity,
      change: calculatePercentageChange(thisMonthStats.stockOutQuantity, lastMonthStats.stockOutQuantity),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Total Value",
      value: `$${(thisMonthStats.totalValue || 0).toFixed(2)}`,
      change: calculatePercentageChange(thisMonthStats.totalValue || 0, lastMonthStats.totalValue || 0),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

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
                {stat.change.toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
