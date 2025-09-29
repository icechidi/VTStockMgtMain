// app/alerts/page.tsx
"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type AlertItem = {
  id: string
  type: string
  title: string
  message?: string
  level?: string
  created_at?: string
  meta?: Record<string, any>
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/alerts")
        if (!res.ok) throw new Error(`Failed to load alerts (${res.status})`)
        const data = await res.json()
        const list: AlertItem[] = Array.isArray(data) ? data : data.alerts ?? []
        if (mounted) setAlerts(list)
      } catch (err: any) {
        if (mounted) setError(err.message ?? "Unknown error")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Alerts</h1>
        </div>
        <div>
          <Button
            onClick={() => {
              setAlerts([])
            }}
          >
            Clear client
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading alerts...</div>}
          {error && <div className="text-red-600">Error: {error}</div>}
          {!loading && !error && alerts.length === 0 && <div className="text-muted-foreground">No alerts available</div>}

          {!loading && alerts.length > 0 && (
            <div className="grid gap-3">
              {alerts.map((a) => (
                <div key={a.id} className="p-3 border rounded flex justify-between items-start">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    {a.message && <div className="text-sm text-muted-foreground">{a.message}</div>}
                    {a.meta && <div className="text-xs text-muted-foreground mt-1">{JSON.stringify(a.meta)}</div>}
                    {a.created_at && <div className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</div>}
                  </div>
                  <Badge className="ml-4 capitalize">{a.level ?? "info"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
