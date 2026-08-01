"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Movement {
  id: number
  item_name: string
  movement_type: "IN" | "OUT"
  quantity: number
  movement_date: string
}

export function RecentMovements() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentMovements()
  }, [])

  const fetchRecentMovements = async () => {
    try {
      const response = await fetch("/api/movements/recent")
      if (response.ok) {
        const data = await response.json()
        setMovements(data)
      }
    } catch (error) {
      console.error("Error fetching recent movements:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">Recent Movements</CardTitle>
        <Link href="/movements">
          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-72 space-y-2.5 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-2.5">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-10 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="thin-scrollbar h-72 space-y-2.5 overflow-y-auto pr-1">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className="flex min-h-[60px] items-center justify-between rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{movement.item_name}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(movement.movement_date)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold">{movement.quantity}</span>
                  <Badge
                    className={
                      movement.movement_type === "IN"
                        ? "bg-success text-success-foreground hover:bg-success"
                        : "bg-destructive text-destructive-foreground hover:bg-destructive"
                    }
                  >
                    {movement.movement_type}
                  </Badge>
                </div>
              </div>
            ))}
            {movements.length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No recent movements found
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
