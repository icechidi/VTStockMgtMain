"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Edit, Trash2, Package, Eye, DollarSign, MapPin, Tag, AlertTriangle } from "lucide-react"
import { AddStockItemDialog } from "@/components/add-stock-item-dialog"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface StockItem {
  id: number
  name: string
  description?: string
  quantity: number
  unit_price: number
  min_quantity: number
  location?: string
  category?: string
  created_at: string
}

interface ItemFilters {
  search: string
  category: string
  location: string
  stockStatus: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

// Main component for the Stocks page, table view set as defaults
export default function StocksPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const { toast } = useToast()

  const [filters, setFilters] = useState<ItemFilters>({
    search: "",
    category: "ALL",
    location: "ALL",
    stockStatus: "ALL",
    sortBy: "name",
    sortOrder: "asc",
  })

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [items, filters])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items")
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error("Error fetching items:", error)
      toast({
        title: "Error",
        description: "Failed to load stock items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...items]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.category?.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    // Category filter
    if (filters.category !== "ALL") {
      filtered = filtered.filter((item) => item.category === filters.category)
    }

    // Location filter
    if (filters.location !== "ALL") {
      filtered = filtered.filter((item) => item.location === filters.location)
    }

    // Stock status filter
    if (filters.stockStatus !== "ALL") {
      filtered = filtered.filter((item) => {
        const status = getStockStatus(item.quantity, item.min_quantity)
        return status.label.toLowerCase().replace(/\s+/g, "-") === filters.stockStatus
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof StockItem]
      let bValue: any = b[filters.sortBy as keyof StockItem]

      if (filters.sortBy === "created_at") {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredItems(filtered)
    setCurrentPage(1)
  }

  const handleAddItem = async (itemData: Omit<StockItem, "id" | "created_at">) => {
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      })

      if (response.ok) {
        const newItem = await response.json()
        setItems([...items, newItem])
        setShowAddDialog(false)
        toast({
          title: "Success",
          description: "Stock item added successfully",
        })
      } else {
        throw new Error("Failed to add item")
      }
    } catch (error) {
      console.error("Error adding item:", error)
      toast({
        title: "Error",
        description: "Failed to add stock item",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setItems(items.filter((item) => item.id !== id))
        toast({
          title: "Success",
          description: "Stock item deleted successfully",
        })
      } else {
        throw new Error("Failed to delete item")
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete stock item",
        variant: "destructive",
      })
    }
  }

  const getStockStatus = (quantity: number, minQuantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (quantity < minQuantity * 0.5) return { label: "Critical", variant: "destructive" as const }
    if (quantity < minQuantity) return { label: "Low Stock", variant: "secondary" as const }
    return { label: "In Stock", variant: "default" as const }
  }

  const resetFilters = () => {
    setFilters({
      search: "",
      category: "ALL",
      location: "ALL",
      stockStatus: "ALL",
      sortBy: "name",
      sortOrder: "asc",
    })
  }

  // Get unique categories and locations for filter options
  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean)))
  const locations = Array.from(new Set(items.map((item) => item.location).filter(Boolean)))

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Stock Items</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Stock Items</h2>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">All Items</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Compact Filters & Search */}
          <Card>
            <CardContent>
              <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative w-full sm:w-48">
                  <Input
                    placeholder="Search items..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-8 pr-3 h-9 text-sm"
                  />
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>

                {/* Category */}
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters({ ...filters, category: value })}
                >
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category!}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Location */}
                <Select
                  value={filters.location}
                  onValueChange={(value) => setFilters({ ...filters, location: value })}
                >
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location ?? ""} value={location ?? ""}>
                        {location ?? "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Stock Status */}
                <Select
                  value={filters.stockStatus}
                  onValueChange={(value) => setFilters({ ...filters, stockStatus: value })}
                >
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split("-")
                    setFilters({ ...filters, sortBy, sortOrder: sortOrder as "asc" | "desc" })
                  }}
                >
                  <SelectTrigger className="w-36 h-9 text-sm">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="quantity-desc">Quantity (High-Low)</SelectItem>
                    <SelectItem value="quantity-asc">Quantity (Low-High)</SelectItem>
                    <SelectItem value="unit_price-desc">Price (High-Low)</SelectItem>
                    <SelectItem value="unit_price-asc">Price (Low-High)</SelectItem>
                    <SelectItem value="created_at-desc">Date Added (Newest)</SelectItem>
                    <SelectItem value="created_at-asc">Date Added (Oldest)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Reset Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
                <div className="text-xs text-muted-foreground ml-auto">
                  Showing {filteredItems.length} of {items.length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Toggle - positioned after filters like in movements page */}
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

          {/* Items Display */}
          {viewMode === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentItems.map((item) => {
                const status = getStockStatus(item.quantity, item.min_quantity)
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium line-clamp-1">{item.name}</CardTitle>
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold">{item.quantity}</div>
                            <div className="text-xs text-muted-foreground">Min: {item.min_quantity}</div>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Unit Price:
                          </span>
                          <span className="font-medium">${item.unit_price}</span>
                        </div>

                        {item.category && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Category:
                            </span>
                            <Badge variant="outline">{item.category}</Badge>
                          </div>
                        )}

                        {item.location && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Location:
                            </span>
                            <span>{item.location}</span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Item
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Category
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium">Quantity</th>
                        <th className="text-left p-4 font-medium">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Price
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => {
                        const status = getStockStatus(item.quantity, item.min_quantity)
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-muted-foreground line-clamp-1">{item.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">{item.category && <Badge variant="outline">{item.category}</Badge>}</td>
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{item.quantity}</div>
                                <div className="text-xs text-muted-foreground">Min: {item.min_quantity}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-medium">${item.unit_price}</span>
                            </td>
                            <td className="p-4">
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </td>
                            <td className="p-4">
                              <span className="text-sm">{item.location}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
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
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
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

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No items found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {filters.search ||
                  filters.category !== "ALL" ||
                  filters.location !== "ALL" ||
                  filters.stockStatus !== "ALL"
                    ? "Try adjusting your filters"
                    : "Get started by adding your first stock item"}
                </p>
                {!filters.search &&
                  filters.category === "ALL" &&
                  filters.location === "ALL" &&
                  filters.stockStatus === "ALL" && (
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Item
                    </Button>
                  )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items
                  .filter((item) => item.quantity <= item.min_quantity)
                  .map((item) => {
                    const status = getStockStatus(item.quantity, item.min_quantity)
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded">
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
                {items.filter((item) => item.quantity <= item.min_quantity).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    All items are well stocked!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span className="font-bold">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-bold">
                      ${items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Stock Items:</span>
                    <span className="font-bold text-orange-600">
                      {items.filter((item) => item.quantity <= item.min_quantity).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Out of Stock:</span>
                    <span className="font-bold text-red-600">{items.filter((item) => item.quantity === 0).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const count = items.filter((item) => item.category === category).length
                    return (
                      <div key={category} className="flex justify-between">
                        <span>{category}:</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AddStockItemDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSubmit={handleAddItem} />
    </div>
  )
}
