"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChartData {
  day: string
  stockIn: number
  stockOut: number
}

export function StockChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [timeframe, setTimeframe] = useState("week")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [timeframe])

  const fetchChartData = async () => {
    try {
      const response = await fetch(`/api/dashboard/chart?timeframe=${timeframe}`)
      if (response.ok) {
        const chartData = await response.json()
        setData(chartData)
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
      // Fallback data
      setData([
        { day: "Mon", stockIn: 45, stockOut: 22 },
        { day: "Tue", stockIn: 38, stockOut: 25 },
        { day: "Wed", stockIn: 55, stockOut: 30 },
        { day: "Thu", stockIn: 41, stockOut: 18 },
        { day: "Fri", stockIn: 60, stockOut: 35 },
        { day: "Sat", stockIn: 25, stockOut: 15 },
        { day: "Sun", stockIn: 10, stockOut: 5 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.stockIn, d.stockOut))) || 1

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stock Movement Trends</CardTitle>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        ) : (
          <div className="h-64 flex items-end justify-between gap-2 p-4">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex items-end gap-1 h-48">
                  <div
                    className="bg-blue-500 rounded-t min-w-[12px] transition-all duration-500"
                    style={{ height: `${(item.stockIn / maxValue) * 180}px` }}
                    title={`Stock In: ${item.stockIn}`}
                  />
                  <div
                    className="bg-red-500 rounded-t min-w-[12px] transition-all duration-500"
                    style={{ height: `${(item.stockOut / maxValue) * 180}px` }}
                    title={`Stock Out: ${item.stockOut}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{item.day}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-sm">Stock In</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-sm">Stock Out</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
