"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChartData {
  day: string
  stockIn: number
  stockOut: number
}

const CHART_HEIGHT = 160

export function StockChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [timeframe, setTimeframe] = useState("week")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [timeframe])

  const fetchChartData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/chart?timeframe=${timeframe}`)
      if (response.ok) {
        const chartData = await response.json()
        setData(chartData)
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setLoading(false)
    }
  }

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.stockIn, d.stockOut)))
  // Round up to a "nice" axis max so gridline labels look intentional (0, step, 2*step...)
  const axisMax = Math.max(4, Math.ceil(maxValue / 2) * 2)
  const axisSteps = [axisMax, axisMax * 0.5, 0]

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">Stock Movement Trends</CardTitle>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="h-8 w-28 text-xs">
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
          <div className="h-40 animate-pulse rounded bg-muted" />
        ) : (
          <div className="flex gap-2">
            <div
              className="flex shrink-0 flex-col justify-between text-right text-[10px] text-muted-foreground"
              style={{ height: CHART_HEIGHT }}
            >
              {axisSteps.map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
            <div className="flex flex-1 items-end justify-between gap-1 border-l pl-2" style={{ height: CHART_HEIGHT }}>
              {data.map((item, index) => (
                <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <div className="flex h-full items-end gap-0.5">
                    <div
                      className="w-2 min-w-[6px] rounded-t bg-[hsl(var(--chart-1))] transition-all duration-500 sm:w-2.5"
                      style={{ height: `${(item.stockIn / axisMax) * 100}%` }}
                      title={`Stock In: ${item.stockIn}`}
                    />
                    <div
                      className="w-2 min-w-[6px] rounded-t bg-[hsl(var(--chart-2))] transition-all duration-500 sm:w-2.5"
                      style={{ height: `${(item.stockOut / axisMax) * 100}%` }}
                      title={`Stock Out: ${item.stockOut}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3 flex justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-[hsl(var(--chart-1))]" />
            <span className="text-xs text-muted-foreground">Stock In</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-[hsl(var(--chart-2))]" />
            <span className="text-xs text-muted-foreground">Stock Out</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
