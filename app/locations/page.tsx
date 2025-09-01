"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Plus, Edit, Trash2, Search, Building, Package, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Location {
  id: string
  name: string
  code: string
  block: string
  status: "active" | "inactive"
  capacity: number
  type: "storage_room" | "office"
  manager?: string
  description?: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  item_count: number
  total_value: number
  created_at: string
  updated_at: string
}

const stockLocationCodes = [
  "B-Block-SR0",
  "B-Block-SR1",
  "B-Block-SR2",
  "B-Block-SR3",
  "B-Block-SR4",
  "A-Block-SR0",
  "A-Block-SR1",
  "A-Block-SR2",
  "Office Storage",
]

export default function LocationsPageDatabase() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [blockFilter, setBlockFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState<Partial<Location>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Fetch locations from database
  const fetchLocations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/locations")
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch locations",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
      toast({
        title: "Error",
        description: "Failed to fetch locations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  const filteredLocations = locations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.block.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || location.status === statusFilter
    const matchesBlock = blockFilter === "all" || location.block === blockFilter
    return matchesSearch && matchesStatus && matchesBlock
  })

  const handleAddLocation = () => {
    setEditingLocation(null)
    setFormData({
      status: "active",
      type: "storage_room",
      capacity: 100,
      block: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setFormData(location)
    setIsDialogOpen(true)
  }

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Location deleted successfully",
        })
        fetchLocations()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete location",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting location:", error)
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.code) {
      toast({
        title: "Error",
        description: "Name and code are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingLocation ? `/api/locations/${editingLocation.id}` : "/api/locations"
      const method = editingLocation ? "PUT" : "POST"

      // Determine block from code if not set
      const block =
        formData.block ||
        (formData.code?.includes("A-Block") ? "A-Block" : formData.code?.includes("B-Block") ? "B-Block" : "Office")

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          block,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Location ${editingLocation ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        setFormData({})
        fetchLocations()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || `Failed to ${editingLocation ? "update" : "create"} location`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving location:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingLocation ? "update" : "create"} location`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUtilizationPercentage = (current: number, capacity: number) => {
    return capacity > 0 ? Math.round((current / capacity) * 100) : 0
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-green-600"
  }

  const totalCapacity = locations.reduce((sum, loc) => sum + loc.capacity, 0)
  const totalCurrentItems = locations.reduce((sum, loc) => sum + loc.item_count, 0)
  const activeLocations = locations.filter((loc) => loc.status === "active").length
  const totalValue = locations.reduce((sum, loc) => sum + Number(loc.total_value), 0)
  const blocks = Array.from(new Set(locations.map((loc) => loc.block)))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading locations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock Locations</h2>
          <p className="text-muted-foreground">Manage your storage locations and track inventory distribution</p>
        </div>
        <Button onClick={handleAddLocation}>
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLocations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{totalCurrentItems} items stored</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Stock Locations</CardTitle>
          <CardDescription>Monitor your storage locations and their utilization</CardDescription>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={blockFilter} onValueChange={setBlockFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Block" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blocks</SelectItem>
                {blocks.map((block) => (
                  <SelectItem key={block} value={block}>
                    {block}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Items / Capacity</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => {
                const utilization = getUtilizationPercentage(location.item_count, location.capacity)
                return (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div className="font-medium">{location.code}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">{location.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{location.block}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="text-sm">
                          <span className={getUtilizationColor(utilization)}>{location.item_count}</span>
                          <span className="text-muted-foreground"> / {location.capacity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              utilization >= 90 ? "bg-red-500" : utilization >= 70 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">{utilization}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${Number(location.total_value).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>{location.manager || "Unassigned"}</TableCell>
                    <TableCell>
                      <Badge variant={location.status === "active" ? "default" : "secondary"}>{location.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditLocation(location)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLocation(location.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
            <DialogDescription>
              {editingLocation ? "Update the location details below." : "Enter the details for the new location."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Location Code *</Label>
                  <Select
                    value={formData.code || ""}
                    onValueChange={(value) => setFormData({ ...formData, code: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location code" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockLocationCodes.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity || ""}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type || ""}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Location["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="storage_room">Storage Room</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manager">Manager</Label>
                  <Input
                    id="manager"
                    value={formData.manager || ""}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || ""}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Location["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingLocation ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  `${editingLocation ? "Update" : "Create"} Location`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
