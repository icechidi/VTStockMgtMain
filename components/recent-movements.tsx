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
      // Fallback data
      setMovements([
        {
          id: 1,
          item_name: "Laptop Dell XPS",
          movement_type: "IN",
          quantity: 5,
          movement_date: new Date().toISOString(),
        },
        { id: 2, item_name: "iPhone 13", movement_type: "OUT", quantity: 2, movement_date: new Date().toISOString() },
        { id: 3, item_name: "HP Printer", movement_type: "IN", quantity: 3, movement_date: new Date().toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Movements</CardTitle>
        <Link href="/movements">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {movements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                <div>
                  <div className="font-medium">{movement.item_name}</div>
                  <div className="text-sm text-muted-foreground">{formatDate(movement.movement_date)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{movement.quantity}</span>
                  <Badge variant={movement.movement_type === "IN" ? "default" : "destructive"}>
                    {movement.movement_type}
                  </Badge>
                </div>
              </div>
            ))}
            {movements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No recent movements found</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
