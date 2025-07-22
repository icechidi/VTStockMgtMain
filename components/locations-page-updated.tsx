"use client"

import type React from "react"

import { useState } from "react"
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
import { MapPin, Plus, Edit, Trash2, Search, Building, Package } from "lucide-react"

interface Location {
  id: string
  name: string
  code: string
  block: string
  status: "active" | "inactive"
  capacity: number
  currentItems: number
  type: "storage_room" | "office"
  manager?: string
  description?: string
}

const stockLocations = [
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

const mockLocations: Location[] = [
  {
    id: "1",
    name: "B-Block Storage Room 0",
    code: "B-Block-SR0",
    block: "B-Block",
    status: "active",
    capacity: 500,
    currentItems: 245,
    type: "storage_room",
    manager: "John Smith",
    description: "Main storage room for hardware components",
  },
  {
    id: "2",
    name: "B-Block Storage Room 1",
    code: "B-Block-SR1",
    block: "B-Block",
    status: "active",
    capacity: 300,
    currentItems: 180,
    type: "storage_room",
    manager: "Jane Doe",
    description: "Secondary storage for accessories",
  },
  {
    id: "3",
    name: "A-Block Storage Room 0",
    code: "A-Block-SR0",
    block: "A-Block",
    status: "active",
    capacity: 400,
    currentItems: 320,
    type: "storage_room",
    manager: "Mike Johnson",
    description: "Software and networking equipment storage",
  },
  {
    id: "4",
    name: "Office Storage",
    code: "Office Storage",
    block: "Office",
    status: "active",
    capacity: 150,
    currentItems: 85,
    type: "office",
    manager: "Sarah Wilson",
    description: "Office supplies and small equipment",
  },
  {
    id: "5",
    name: "B-Block Storage Room 2",
    code: "B-Block-SR2",
    block: "B-Block",
    status: "inactive",
    capacity: 250,
    currentItems: 0,
    type: "storage_room",
    description: "Under maintenance",
  },
]

export function LocationsPageUpdated() {
  const [locations, setLocations] = useState<Location[]>(mockLocations)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [blockFilter, setBlockFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState<Partial<Location>>({})

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
      currentItems: 0,
    })
    setIsDialogOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setFormData(location)
    setIsDialogOpen(true)
  }

  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter((loc) => loc.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingLocation) {
      setLocations(locations.map((loc) => (loc.id === editingLocation.id ? { ...loc, ...formData } : loc)))
    } else {
      const newLocation: Location = {
        ...formData,
        id: Date.now().toString(),
        block: formData.code?.includes("A-Block")
          ? "A-Block"
          : formData.code?.includes("B-Block")
            ? "B-Block"
            : "Office",
      } as Location
      setLocations([...locations, newLocation])
    }
    setIsDialogOpen(false)
    setFormData({})
  }

  const getUtilizationPercentage = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100)
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-green-600"
  }

  const totalCapacity = locations.reduce((sum, loc) => sum + loc.capacity, 0)
  const totalCurrentItems = locations.reduce((sum, loc) => sum + loc.currentItems, 0)
  const activeLocations = locations.filter((loc) => loc.status === "active").length
  const blocks = Array.from(new Set(locations.map((loc) => loc.block)))

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
            <CardTitle className="text-sm font-medium">Current Items</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCurrentItems}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((totalCurrentItems / totalCapacity) * 100)}% utilized
            </div>
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
                <TableHead>Utilization</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => {
                const utilization = getUtilizationPercentage(location.currentItems, location.capacity)
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
                          <span className={getUtilizationColor(utilization)}>{location.currentItems}</span>
                          <span className="text-muted-foreground"> / {location.capacity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              utilization >= 90 ? "bg-red-500" : utilization >= 70 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                            style={{ width: `${utilization}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">{utilization}%</div>
                      </div>
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
                      {stockLocations.map((location) => (
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
                  <Label htmlFor="currentItems">Current Items</Label>
                  <Input
                    id="currentItems"
                    type="number"
                    min="0"
                    value={formData.currentItems || ""}
                    onChange={(e) => setFormData({ ...formData, currentItems: Number(e.target.value) })}
                  />
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingLocation ? "Update" : "Create"} Location</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
