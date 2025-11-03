"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Loader2, Edit, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

interface RepairItem {
  id: string
  item_name: string
  description?: string
  issue_description: string
  status: "pending" | "in_progress" | "fixed" | "returned"
  priority: "low" | "medium" | "high"
  assigned_to?: string
  created_at: string
  updated_at: string
  returned_date?: string
  notes?: string
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<RepairItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  useEffect(() => {
    fetchRepairs()
  }, [])

  const fetchRepairs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (priorityFilter !== "all") params.append("priority", priorityFilter)

      const response = await fetch(`/api/repairs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRepairs(data)
      }
    } catch (error) {
      console.error("Error fetching repairs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRepairs()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, priorityFilter])

  const handleMarkAsReturned = async (repairId: string) => {
    try {
      const response = await fetch(`/api/repairs/${repairId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (response.ok) {
        fetchRepairs()
      }
    } catch (error) {
      console.error("Error marking as returned:", error)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "in_progress":
        return "default"
      case "fixed":
        return "outline"
      case "returned":
        return "default"
      default:
        return "secondary"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const pendingRepairs = repairs.filter((r) => r.status === "pending").length
  const inProgressRepairs = repairs.filter((r) => r.status === "in_progress").length
  const fixedRepairs = repairs.filter((r) => r.status === "fixed").length
  const returnedRepairs = repairs.filter((r) => r.status === "returned").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading repairs...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Repair Management</h2>
          <p className="text-muted-foreground">Track and manage item repairs</p>
        </div>
        <Link href="/repairs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Repair
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRepairs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressRepairs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fixed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fixedRepairs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returnedRepairs}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Repairs</CardTitle>
          <CardDescription>Track items that need repair and their status</CardDescription>
          <div className="flex items-center space-x-4 flex-wrap gap-2 pt-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items, issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairs.map((repair) => (
                <TableRow key={repair.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{repair.item_name}</div>
                      <div className="text-sm text-muted-foreground">{repair.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="text-sm">{repair.issue_description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(repair.status)} className="capitalize">
                      {repair.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`capitalize font-medium ${getPriorityColor(repair.priority)}`}>
                      {repair.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{repair.assigned_to || "-"}</div>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(repair.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/repairs/${repair.id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {repair.status === "fixed" && (
                        <Button size="sm" variant="default" onClick={() => handleMarkAsReturned(repair.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Return
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {repairs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No repairs found. Create one to get started.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
