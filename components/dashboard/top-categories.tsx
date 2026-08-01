"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers } from "lucide-react"

interface CategoryRow {
  id: string
  name: string
  item_count: number
}

const DOT_COLORS = [
  "bg-[hsl(var(--chart-1))]",
  "bg-[hsl(var(--chart-3))]",
  "bg-[hsl(var(--chart-4))]",
  "bg-[hsl(var(--chart-5))]",
  "bg-[hsl(var(--chart-2))]",
]

export function TopCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/top-categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching top categories:", err))
      .finally(() => setLoading(false))
  }, [])

  const maxCount = Math.max(1, ...categories.map((c) => c.item_count))

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Top Categories</CardTitle>
        </div>
        <Link href="/categories">
          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs bg-transparent">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)
        ) : categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No categories yet</p>
        ) : (
          categories.map((cat, i) => (
            <div key={cat.id} className="flex items-center gap-3">
              <div className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`} />
              <span className="min-w-0 flex-1 truncate text-sm">{cat.name}</span>
              <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">{cat.item_count}</span>
              <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:w-24">
                <div
                  className={`h-full rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`}
                  style={{ width: `${(cat.item_count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
