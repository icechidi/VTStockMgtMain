"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2 } from "lucide-react"

interface SupplierRow {
  id: string
  name: string
  code: string
  status: string
  items_count: number
}

export function SuppliersOverview() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/suppliers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const rows: SupplierRow[] = Array.isArray(data) ? data : (data?.suppliers ?? [])
        const sorted = [...rows]
          .sort((a, b) => Number(b.items_count ?? 0) - Number(a.items_count ?? 0))
          .slice(0, 5)
        setSuppliers(sorted)
      })
      .catch((err) => console.error("Error fetching suppliers:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Suppliers</CardTitle>
        </div>
        <Link href="/suppliers">
          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs bg-transparent">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)
        ) : suppliers.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No suppliers yet</p>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                {s.code?.slice(0, 2)?.toUpperCase() || s.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{Number(s.items_count ?? 0)} items supplied</p>
              </div>
              <Badge
                variant="outline"
                className={
                  s.status === "active"
                    ? "border-success/30 text-success"
                    : s.status === "pending"
                      ? "border-warning/30 text-warning"
                      : "text-muted-foreground"
                }
              >
                {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : "Unknown"}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
