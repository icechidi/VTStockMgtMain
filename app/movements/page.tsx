"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, CalendarIcon, ArrowUpDown, TrendingUp,
         TrendingDown, Package, Clock, MapPin, } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import AddMovementDialog from "@/components/add-movement-dialog"
import { MovementDetailsDialog } from "@/components/movement-details-dialog"
import { EditMovementDialog } from "@/components/edit-movement-dialog"
import { MovementStats } from "@/components/movement-stats"
import { useToast } from "@/hooks/use-toast"

interface StockMovement {
  id: number
  item_id: number
  item_name: string
  movement_type: "IN" | "OUT"
  quantity: number
  unit_price?: number
  total_value?: number
  notes?: string
  location?: string
  user_name?: string
  reference_number?: string
  supplier?: string
  customer?: string
  movement_date: string
  created_at: string
}

interface MovementFilters {
  search: string
  type: string
  location: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
  sortBy: string
  sortOrder: "asc" | "desc"
}

// Types used by AddMovementDialog (create payload)
interface MovementCreate {
  item_id: string
  movement_type: "IN" | "OUT"
  quantity: number
  unit_price?: number
  total_value?: number
  reference_number?: string
  supplier_id?: string
  customer?: string
  notes?: string
  location_id?: string
  user_id: string
  received_by?: string
  movement_date: string
}

interface StockItem {
  id: string
  name: string
  barcode: string
  quantity: number
  unit_price: number
  category_name: string
  subcategory_name: string
  location_name: string
  location_code: string
}

interface Location {
  id: string
  name: string
  code: string
}

interface User {
  id: string
  name: string
}

interface Supplier {
  id: string
  name: string
  code: string
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const { toast } = useToast()

  const [filters, setFilters] = useState<MovementFilters>({
    search: "",
    type: "ALL",
    location: "ALL",
    dateFrom: undefined,
    dateTo: undefined,
    sortBy: "movement_date",
    sortOrder: "desc",
  })

  // Supporting data for AddMovementDialog
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supportLoading, setSupportLoading] = useState(true)

  useEffect(() => {
    // Fetch movements and supporting data in parallel
    const fetchAll = async () => {
      try {
        setLoading(true)
        setSupportLoading(true)

        const [movRes, itemsRes, locRes, usersRes, suppliersRes] = await Promise.allSettled([
          fetch("/api/movements"),
          fetch("/api/stock-items"),
          fetch("/api/locations"),
          fetch("/api/users"),
          fetch("/api/suppliers"),
        ])

        // movements
        if (movRes.status === "fulfilled") {
          const r = movRes.value
          if (r.ok) {
            const data = await r.json()
            setMovements(data)
          } else {
            console.warn("/api/movements responded with", r.status)
          }
        }

        // stock items
        if (itemsRes.status === "fulfilled") {
          const r = itemsRes.value
          if (r.ok) setStockItems(await r.json())
        }

        // locations
        if (locRes.status === "fulfilled") {
          const r = locRes.value
          if (r.ok) setLocations(await r.json())
        }

        // users
        if (usersRes.status === "fulfilled") {
          const r = usersRes.value
          if (r.ok) setUsers(await r.json())
        }

        // suppliers
        if (suppliersRes.status === "fulfilled") {
          const r = suppliersRes.value
          if (r.ok) setSuppliers(await r.json())
        }
      } catch (err) {
        console.error("Error fetching initial data", err)
        setError("Failed to load initial data")
      } finally {
        setLoading(false)
        setSupportLoading(false)
      }
    }

    fetchAll()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [movements, filters])

  const applyFilters = () => {
    let filtered = [...movements]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (movement) =>
          movement.item_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          movement.notes?.toLowerCase().includes(filters.search.toLowerCase()) ||
          movement.reference_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
          movement.supplier?.toLowerCase().includes(filters.search.toLowerCase()) ||
          movement.customer?.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    // Type filter
    if (filters.type !== "ALL") {
      filtered = filtered.filter((movement) => movement.movement_type === filters.type)
    }

    // Location filter
    if (filters.location !== "ALL") {
      filtered = filtered.filter((movement) => movement.location === filters.location)
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter((movement) => new Date(movement.movement_date) >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((movement) => new Date(movement.movement_date) <= endDate)
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof StockMovement]
      let bValue: any = b[filters.sortBy as keyof StockMovement]

      if (filters.sortBy === "movement_date" || filters.sortBy === "created_at") {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredMovements(filtered)
    setCurrentPage(1)
  }

  // create movement (called by AddMovementDialog)
  const handleAddMovement = async (movementData: MovementCreate) => {
    try {
      const response = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movementData),
      })

      if (!response.ok) throw new Error("Failed to add movement")

      const newMovement = await response.json()

      // Append the new movement if API returns it; otherwise optimistically add a minimal record
      setMovements((prev) => [newMovement, ...prev])
      setShowAddDialog(false)
      toast({ title: "Success", description: "Stock movement recorded successfully" })
    } catch (err) {
      console.error("Error adding movement:", err)
      toast({ title: "Error", description: "Failed to record stock movement", variant: "destructive" })
    }
  }

  const handleEditMovement = async (id: number, movementData: Partial<StockMovement>) => {
    try {
      const response = await fetch(`/api/movements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movementData),
      })

      if (response.ok) {
        const updatedMovement = await response.json()
        setMovements(movements.map((m) => (m.id === id ? updatedMovement : m)))
        setShowEditDialog(false)
        setSelectedMovement(null)
        toast({ title: "Success", description: "Movement updated successfully" })
      } else {
        throw new Error("Failed to update movement")
      }
    } catch (error) {
      console.error("Error updating movement:", error)
      toast({ title: "Error", description: "Failed to update movement", variant: "destructive" })
    }
  }

  const handleDeleteMovement = async (id: number) => {
    if (!confirm("Are you sure you want to delete this movement? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/movements/${id}`, { method: "DELETE" })

      if (response.ok) {
        setMovements(movements.filter((m) => m.id !== id))
        toast({ title: "Success", description: "Movement deleted successfully" })
      } else {
        throw new Error("Failed to delete movement")
      }
    } catch (error) {
      console.error("Error deleting movement:", error)
      toast({ title: "Error", description: "Failed to delete movement", variant: "destructive" })
    }
  }

  const exportMovements = () => {
    const csvContent = [
      ["Date", "Item", "Type", "Quantity", "Value", "Location", "Reference", "Notes"].join(","),
      ...filteredMovements.map((movement) =>
        [
          format(new Date(movement.movement_date), "yyyy-MM-dd HH:mm"),
          movement.item_name,
          movement.movement_type,
          movement.quantity,
          movement.total_value || "",
          movement.location || "",
          movement.reference_number || "",
          movement.notes || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stock-movements-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setFilters({ search: "", type: "ALL", location: "ALL", dateFrom: undefined, dateTo: undefined, sortBy: "movement_date", sortOrder: "desc" })
  }

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMovements = filteredMovements.slice(startIndex, endIndex)

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy HH:mm")
  }

  const getMovementIcon = (type: "IN" | "OUT") => {
    return type === "IN" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    )
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Stock Movements</h2>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Stock Movements</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportMovements}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Movement
          </Button>
        </div>
      </div>

      <MovementStats movements={movements} />

      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movements">All Movements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search movements..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="IN">Stock In</SelectItem>
                      <SelectItem value="OUT">Stock Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select
                    value={filters.location}
                    onValueChange={(value) => setFilters({ ...filters, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Locations</SelectItem>
                      <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                      <SelectItem value="Store A">Store A</SelectItem>
                      <SelectItem value="Store B">Store B</SelectItem>
                      <SelectItem value="Distribution Center">Distribution Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateFrom && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => setFilters({ ...filters, dateFrom: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateTo && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => setFilters({ ...filters, dateTo: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split("-")
                      setFilters({ ...filters, sortBy, sortOrder: sortOrder as "asc" | "desc" })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movement_date-desc">Date (Newest)</SelectItem>
                      <SelectItem value="movement_date-asc">Date (Oldest)</SelectItem>
                      <SelectItem value="item_name-asc">Item Name (A-Z)</SelectItem>
                      <SelectItem value="item_name-desc">Item Name (Z-A)</SelectItem>
                      <SelectItem value="quantity-desc">Quantity (High-Low)</SelectItem>
                      <SelectItem value="quantity-asc">Quantity (Low-High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredMovements.length} of {movements.length} movements
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                Table View
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("cards")}
              >
                Card View
              </Button>
            </div>
          </div>

          {/* Movements List */}
          {viewMode === "table" ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Date/Time</th>
                        <th className="text-left p-4 font-medium">Item</th>
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Quantity</th>
                        <th className="text-left p-4 font-medium">Value</th>
                        <th className="text-left p-4 font-medium">Location</th>
                        <th className="text-left p-4 font-medium">Reference</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMovements.map((movement) => (
                            <tr key={movement.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatDateTime(movement.movement_date)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{movement.item_name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {getMovementIcon(movement.movement_type)}
                              <Badge variant={movement.movement_type === "IN" ? "default" : "destructive"}>
                                {movement.movement_type}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-medium">{movement.quantity}</span>
                          </td>
                          <td className="p-4">
                            {movement.total_value && <span>${Number(movement.total_value).toFixed(2)}</span>}
                          </td>
                          <td className="p-4">
                            {movement.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{movement.location}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">{movement.reference_number}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMovement(movement)
                                  setShowDetailsDialog(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMovement(movement)
                                  setShowEditDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMovement(movement.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentMovements.map((movement) => (
                <Card key={movement.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movement_type)}
                        <CardTitle className="text-lg">{movement.item_name}</CardTitle>
                      </div>
                      <Badge variant={movement.movement_type === "IN" ? "default" : "destructive"}>
                        {movement.movement_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{movement.quantity}</span>
                    </div>

                    {movement.total_value && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Value:</span>
                        <span className="font-medium">${Number(movement.total_value).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Date:</span>
                      <span className="text-sm">{formatDateTime(movement.movement_date)}</span>
                    </div>

                    {movement.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <span className="text-sm">{movement.location}</span>
                      </div>
                    )}

                    {movement.reference_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Reference:</span>
                        <span className="text-sm">{movement.reference_number}</span>
                      </div>
                    )}

                    {movement.notes && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Notes:</span>
                        <p className="text-sm line-clamp-2">{movement.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedMovement(movement)
                          setShowDetailsDialog(true)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMovement(movement)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMovement(movement.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredMovements.length)} of {filteredMovements.length}{" "}
                movements
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {filteredMovements.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowUpDown className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No movements found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {filters.search ||
                  filters.type !== "ALL" ||
                  filters.location !== "ALL" ||
                  filters.dateFrom ||
                  filters.dateTo
                    ? "Try adjusting your filters"
                    : "Get started by recording your first stock movement"}
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Movement
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Movement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics charts will be implemented here</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Top moving items analysis will be shown here</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddMovementDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddMovement}
        stockItems={stockItems}
        locations={locations}
        users={users}
        suppliers={suppliers}
      />

      {selectedMovement && (
        <>
          <MovementDetailsDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            movement={{
              ...selectedMovement,
              created_at: selectedMovement.created_at ?? "",
            }}
          />

          <EditMovementDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            movement={{
              ...selectedMovement,
              created_at: selectedMovement.created_at ?? "",
            }}
            onSubmit={(data) => handleEditMovement(selectedMovement.id, data)}
          />
        </>
      )}
    </div>
  )
}
