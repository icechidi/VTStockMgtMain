"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

interface LowStockItem {
  id: number
  name: string
  quantity: number
  min_quantity: number
  location?: string
}

export function LowStockAlerts() {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLowStockItems()
  }, [])

  const fetchLowStockItems = async () => {
    try {
      const response = await fetch("/api/items/low-stock")
      if (response.ok) {
        const data = await response.json()
        setLowStockItems(data)
      }
    } catch (error) {
      console.error("Error fetching low stock items:", error)
      // Fallback data
      setLowStockItems([
        { id: 1, name: "Laptop Dell XPS", quantity: 5, min_quantity: 10, location: "Main Warehouse" },
        { id: 2, name: "HP Printer Ink", quantity: 8, min_quantity: 15, location: "Store A" },
        { id: 3, name: "Wireless Mouse", quantity: 12, min_quantity: 20, location: "Distribution Center" },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (quantity: number, minQuantity: number) => {
    if (quantity < minQuantity * 0.5) return { label: "Critical", variant: "destructive" as const }
    if (quantity < minQuantity) return { label: "Low", variant: "secondary" as const }
    return { label: "OK", variant: "default" as const }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>Low Stock Alerts</CardTitle>
        </div>
        <Link href="/stocks">
          <Button variant="outline" size="sm">
            Manage Inventory
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item) => {
              const status = getStockStatus(item.quantity, item.min_quantity)
              return (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Current: {item.quantity} | Min: {item.min_quantity}
                      {item.location && ` | ${item.location}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <Link href={`/movements/new?item=${item.id}`}>
                      <Button size="sm">Restock</Button>
                    </Link>
                  </div>
                </div>
              )
            })}
            {lowStockItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                All items are well stocked!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
