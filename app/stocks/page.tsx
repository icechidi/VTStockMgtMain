"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Plus, Search, MapPin, Tag, BarChart3, Loader2, QrCode, Scan, Filter, Eye, Edit, Trash2, DollarSign, AlertTriangle,} from "lucide-react"
import { AddStockItemDialogDatabase } from "@/components/add-stock-item-dialog-database"
import { CategoryManagementDatabase } from "@/components/category-management-database"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { BarcodeGenerator } from "@/components/barcode-generator"
import { ItemLookupResult } from "@/components/item-lookup-result"
import { ItemNotFound } from "@/components/item-not-found"
import { toast } from "@/components/ui/use-toast"

export interface StockItem {
  id: string, name: string,  description?: string, quantity: number, unit_price: number,  min_quantity: number,  
  status: "in_stock" | "low_stock" | "out_of_stock", barcode: string, category_id: string, subcategory_id: string, 
  location_id: string, supplier_id?: string, category_name: string, subcategory_name: string, location_name: string, location_code: string, created_by_name: string
  created_at: string, updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  subcategories: { id: string; name: string; description?: string }[]
}

export interface Location {
  id: string
  name: string
  code: string
  block: string
  type: string
  status: string
  capacity: number
  current_items: number
}


interface Supplier {
  id: string
  name: string
  code: string
}

interface ItemFilters {
  search: string
  category: string
  location: string
  stockStatus: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

export default function InventoryPageDatabase() {
  const [inventory, setInventory] = useState<StockItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Filters (following the layout/setup of the first file)
  const [filters, setFilters] = useState<ItemFilters>({
    search: "",
    category: "ALL",
    location: "ALL",
    stockStatus: "ALL",
    sortBy: "created_at",
    sortOrder: "desc", // recently added first
  })

  const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)

  // Dialog / modal states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isBarcodeGeneratorOpen, setIsBarcodeGeneratorOpen] = useState(false)
  const [isItemResultOpen, setIsItemResultOpen] = useState(false)
  const [isItemNotFoundOpen, setIsItemNotFoundOpen] = useState(false)

  

  // View & Edit states
  const [scannedItem, setScannedItem] = useState<StockItem | null>(null)
  const [notFoundBarcode, setNotFoundBarcode] = useState("")
  const [selectedItemForBarcode, setSelectedItemForBarcode] = useState<StockItem | null>(null)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    quantity: 0,
    unit_price: 0,
    min_quantity: 0,
    category_id: "", // kept empty string for placeholder
    location_id: "",
    supplier_id: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchInventory(), fetchCategories(), fetchLocations()])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

    // fetch suppliers once
    useEffect(() => {
      let mounted = true
      const fetchSuppliers = async () => {
        setLoadingSuppliers(true)
        try {
          const res = await fetch("/api/suppliers")
          if (!res.ok) throw new Error("Failed to fetch suppliers")
          const data = await res.json()
          // backend might return { suppliers: [...] } or array directly
          const arr = Array.isArray(data) ? data : data?.suppliers ?? []
          if (mounted) setSuppliers(arr)
        } catch (err) {
          console.error("Error fetching suppliers:", err)
          if (mounted) setSuppliers([])
        } finally {
          if (mounted) setLoadingSuppliers(false)
        }
      }
      fetchSuppliers()
      return () => {
        mounted = false
      }
    }, [])

      // open edit modal and populate editForm
  const openEdit = (item: StockItem) => {
    setEditingItem(item)
    setEditForm({
      name: item.name || "",
      description: item.description || "",
      quantity: item.quantity || 0,
      unit_price: Number(item.unit_price) || 0,
      min_quantity: item.min_quantity || 0,
      category_id: item.category_id || "UNSPECIFIED",
      location_id: item.location_id || "UNSPECIFIED",
      supplier_id: item.supplier_id || "UNSPECIFIED",
    })
    setIsEditOpen(true)
  }

  // reflect editingItem changes to form (if changed externally)
  useEffect(() => {
    if (!editingItem) return
    setEditForm((prev) => ({
      ...prev,
      name: editingItem.name || prev.name,
      description: editingItem.description || prev.description,
      quantity: editingItem.quantity || prev.quantity,
      unit_price: Number(editingItem.unit_price) || prev.unit_price,
      min_quantity: editingItem.min_quantity || prev.min_quantity,
      category_id: editingItem.category_id || prev.category_id,
      location_id: editingItem.location_id || prev.location_id,
      supplier_id: editingItem.supplier_id || prev.supplier_id,
    }))
  }, [editingItem])

  const closeEdit = () => {
    setIsEditOpen(false)
    setEditingItem(null)
    // optional: reset form
    setEditForm({
      name: "",
      description: "",
      quantity: 0,
      unit_price: 0,
      min_quantity: 0,
      category_id: "UNSPECIFIED",
      location_id: "UNSPECIFIED",
      supplier_id: "UNSPECIFIED",
    })
  }

  // submit edit
  const submitEdit = async () => {
    if (!editingItem) return
    const payload = {
      name: editForm.name,
      description: editForm.description,
      quantity: Number(editForm.quantity),
      unit_price: Number(editForm.unit_price),
      min_quantity: Number(editForm.min_quantity),
      category_id: editForm.category_id === "UNSPECIFIED" ? null : editForm.category_id,
      location_id: editForm.location_id === "UNSPECIFIED" ? null : editForm.location_id,
      supplier_id: editForm.supplier_id === "UNSPECIFIED" ? null : editForm.supplier_id,
    }

    try {
      const res = await fetch(`/api/items/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast({
          title: "Update failed",
          description: err?.error || "Failed to update item",
          variant: "destructive",
        })
        return
      }

      const updated = await res.json()

      // update local items array
      setInventory((prev: StockItem[]) =>
        prev.map((it: StockItem) => (String(it.id) === String(updated.id) ? updated as StockItem : it))
      )

      // update currently editing item + close modal
      setEditingItem(updated)
      toast({
        title: "Saved",
        description: "Item updated successfully",
      })
      closeEdit()
    } catch (err) {
      console.error("Error updating item:", err)
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append("search", filters.search)
      if (filters.location !== "ALL") params.append("location", filters.location)
      if (filters.category !== "ALL") params.append("category", filters.category)
      if (filters.stockStatus !== "ALL") params.append("status", filters.stockStatus)

      const response = await fetch(`/api/stock-items?${params}`)
      if (response.ok) {
        const data: StockItem[] = await response.json()
        // ensure sorting by created_at desc by default (recent first)
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setInventory(data)
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) setCategories(await response.json())
    } catch (error) {
      console.error(error)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations")
      if (response.ok) setLocations(await response.json())
    } catch (error) {
      console.error(error)
    }
  }


  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers")
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || data)
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }

  // Debounced server fetch for search/filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory()
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.location, filters.category, filters.stockStatus])

  // Apply client-side filters + sorting and update filteredItems
  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory, filters])

  const applyFilters = () => {
    let filtered = [...inventory]

    // Search across name, description, category_name
    if (filters.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q) ||
          (item.category_name ?? "").toLowerCase().includes(q)
      )
    }

    // Category filter: comparing category_name to the filter (we expose category names in the select)
    if (filters.category !== "ALL") {
      filtered = filtered.filter((item) => item.category_name === filters.category)
    }

    // Location filter: comparing location_name
    if (filters.location !== "ALL") {
      filtered = filtered.filter((item) => item.location_name === filters.location)
    }

    // Stock status filter (normalize)
    if (filters.stockStatus !== "ALL") {
      filtered = filtered.filter((item) => {
        const statusLabel = getStockStatus(item.quantity, item.min_quantity).label.toLowerCase().replace(/\s+/g, "-")
        return statusLabel === filters.stockStatus
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof StockItem]
      let bValue: any = b[filters.sortBy as keyof StockItem]

      if (filters.sortBy === "created_at") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
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

  const resetFilters = () => {
    setFilters({
      search: "",
      category: "ALL",
      location: "ALL",
      stockStatus: "ALL",
      sortBy: "created_at",
      sortOrder: "desc",
    })
  }

  const handleAddItem = async (data: any) => {
    try {
      const response = await fetch("/api/stock-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setIsAddDialogOpen(false)
        // refresh inventory (server returns created_at etc.)
        await fetchInventory()
      } else {
        console.error("Failed to create item")
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleItemFound = (item: StockItem) => {
    setScannedItem(item)
    setIsItemResultOpen(true)
  }
  const handleItemNotFound = (barcode: string) => {
    setNotFoundBarcode(barcode)
    setIsItemNotFoundOpen(true)
  }
  const handleScanBarcode = async (barcode: string) => {
    try {
      const response = await fetch(`/api/stock-items/barcode/${barcode}`)
      if (response.ok) handleItemFound(await response.json())
      else handleItemNotFound(barcode)
    } catch {
      handleItemNotFound(barcode)
    }
  }
  const handleCreateItemFromBarcode = (barcode: string) => {
    setIsAddDialogOpen(true)
    setIsItemNotFoundOpen(false)
  }
  const handleGenerateBarcode = (item: StockItem) => {
    setSelectedItemForBarcode(item)
    setIsBarcodeGeneratorOpen(true)
    setIsItemResultOpen(false)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "in_stock":
        return "default"
      case "low_stock":
        return "secondary"
      case "out_of_stock":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStockStatus = (quantity: number, minQuantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (minQuantity && quantity < minQuantity * 0.5) return { label: "Critical", variant: "destructive" as const }
    if (minQuantity && quantity < minQuantity) return { label: "Low Stock", variant: "secondary" as const }
    return { label: "In Stock", variant: "default" as const }
  }

  // Get unique categories (names) and locations (names) for filter options (like first file)
  const categoryOptions = Array.from(new Set(inventory.map((i) => i.category_name).filter(Boolean)))
  const locationOptions = Array.from(new Set(inventory.map((i) => i.location_name).filter(Boolean)))

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

  // ----- Edit flow helpers -----
  const openEditModal = (item: StockItem) => {
    setEditingItem(item)
    setEditForm({
      name: item.name ?? "",
      description: item.description ?? "",
      quantity: item.quantity ?? 0,
      unit_price: item.unit_price ?? 0,
      min_quantity: item.min_quantity ?? 0,
      category_id: item.category_id ?? "",
      location_id: item.location_id ?? "",
      supplier_id: item.supplier_id ?? "",
    })
    setIsEditOpen(true)
  }

  // const submitEdit = async () => {
  //   if (!editingItem) return
  //   const payload = {
  //     name: editForm.name,
  //     description: editForm.description,
  //     quantity: Number(editForm.quantity),
  //     unit_price: Number(editForm.unit_price),
  //     min_quantity: Number(editForm.min_quantity),
  //     // convert unspecified/placeholder to null for backend
  //     category_id: editForm.category_id && editForm.category_id !== "UNSPECIFIED" ? editForm.category_id : null,
  //     location_id: editForm.location_id && editForm.location_id !== "UNSPECIFIED" ? editForm.location_id : null,
  //     supplier_id: editForm.supplier_id === "UNSPECIFIED" ? null : editForm.supplier_id,
  //     status
  //     :
  //       Number(editForm.quantity) === 0
  //         ? "out_of_stock"
  //         : Number(editForm.min_quantity) && Number(editForm.quantity) < Number(editForm.min_quantity)
  //         ? "low_stock"
  //         : "in_stock",
  //   }
  //   try {
  //     const response = await fetch(`/api/stock-items/${editingItem.id}`, {
  //       method: "PUT",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     })
  //     if (!res.ok) {
  //       const err = await res.json().catch(() => null)
  //       toast({
  //         title: "Update failed",
  //         description: err?.error || "Failed to update item",
  //         variant: "destructive",
  //       })
  //       return
  //     }

  //     const updated = await res.json()

  //     // update local items array
  //     setItems((prev) => prev.map((it) => (String(it.id) === String(updated.id) ? updated : it)))

  //     // update currently editing item + close modal
  //     setEditingItem(updated)
  //     toast({
  //       title: "Saved",
  //       description: "Item updated successfully",
  //     })
  //     closeEdit()
  //   } catch (err) {
  //     console.error("Error updating item:", err)
  //     toast({
  //       title: "Update failed",
  //       description: "An unexpected error occurred",
  //       variant: "destructive",
  //     })
  //   }
  // }


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    try {
      const res = await fetch(`/api/stock-items/${id}`, { method: "DELETE" })
      if (res.ok) {
        // remove locally for instant feedback
        setInventory((prev) => prev.filter((i) => i.id !== id))
        // also refresh filtered list
        await fetchInventory()
      } else {
        console.error("Failed to delete")
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Pagination window generator (sliding window of page buttons)
  const renderPageButtons = () => {
    const maxButtons = 5
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxButtons / 2)
    let start = Math.max(1, currentPage - half)
    let end = start + maxButtons - 1

    if (end > totalPages) {
      end = totalPages
      start = end - maxButtons + 1
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-4">
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
      {/* Header with Add & Scan */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Stock Items</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsScannerOpen(true)} variant="outline">
            <Scan className="mr-2 h-4 w-4" />
            Scan Barcode
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* TOP Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Items</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{inventory.length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Value</CardTitle><BarChart3 className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">${inventory.reduce((sum,item)=>sum+item.unit_price*item.quantity,0).toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Low Stock</CardTitle><Package className="h-4 w-4 text-yellow-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{inventory.filter(i=>i.status==="low_stock").length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Out of Stock</CardTitle><Package className="h-4 w-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{inventory.filter(i=>i.status==="out_of_stock").length}</div></CardContent></Card>
      </div>

      
      {/* Tabs: All Items / Low Stock / Analytics */}
      <Tabs defaultValue="all-items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-items">All Items</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* All Items Tab */}
        <TabsContent value="all-items" className="space-y-4">
          {/* Filters card (compact like first file) */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Filter className="h-4 w-4" />
                <span className="text-sm">Filters & Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-end md:gap-3 gap-2">
                {/* Search */}
                <div className="flex-1 min-w-[140px]">
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-8 pr-2 py-1.5 text-sm rounded-md border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition h-8"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="min-w-[120px]">
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Category</label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                    <SelectTrigger className="rounded-md border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition h-8 text-sm">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Categories</SelectItem>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category} value={category!} className="text-sm">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="min-w-[120px]">
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Location</label>
                  <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value })}>
                    <SelectTrigger className="rounded-md border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition h-8 text-sm">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Locations</SelectItem>
                      {locationOptions.map((location) => (
                        <SelectItem key={location ?? ""} value={location ?? ""} className="text-sm">
                          {location ?? "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock Status */}
                <div className="min-w-[120px]">
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Stock Status</label>
                  <Select
                    value={filters.stockStatus}
                    onValueChange={(value) => setFilters({ ...filters, stockStatus: value })}
                  >
                    <SelectTrigger className="rounded-md border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition h-8 text-sm">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="low-stock">Low Stock</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="min-w-[130px]">
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Sort By</label>
                  <Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split("-")
                      setFilters({ ...filters, sortBy, sortOrder: sortOrder as "asc" | "desc" })
                    }}
                  >
                    <SelectTrigger className="rounded-md border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 transition h-8 text-sm">
                      <SelectValue />
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
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-md border-gray-300 h-8 px-3 text-xs">
                    Reset
                  </Button>
                </div>
              </div>

              {/* Filter summary */}
              <div className="flex flex-wrap gap-1 mt-2 text-[11px] text-muted-foreground">
                {filters.search && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    Search: <b>{filters.search}</b>
                  </span>
                )}
                {filters.category !== "ALL" && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    Category: <b>{filters.category}</b>
                  </span>
                )}
                {filters.location !== "ALL" && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    Location: <b>{filters.location}</b>
                  </span>
                )}
                {filters.stockStatus !== "ALL" && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    Status: <b>{filters.stockStatus.replace(/-/g, " ")}</b>
                  </span>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground mt-1">
                Showing {filteredItems.length} of {inventory.length} items
              </div>
            </CardContent>
          </Card>


          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
                Table View
              </Button>
              <Button variant={viewMode === "cards" ? "default" : "outline"} size="sm" onClick={() => setViewMode("cards")}>
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
                        {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}

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
                          <span className="font-medium">${Number(item.unit_price).toFixed(2)}</span>
                        </div>

                        {item.category_name && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Category:
                            </span>
                            <Badge variant="outline">{item.category_name}</Badge>
                          </div>
                        )}

                        {item.location_name && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Location:
                            </span>
                            <span>{item.location_name}</span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setScannedItem(item)
                              setIsItemResultOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openEditModal(item)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
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
                                {item.description && <div className="text-sm text-muted-foreground line-clamp-1">{item.description}</div>}
                              </div>
                            </td>
                            <td className="p-4">{item.category_name && <Badge variant="outline">{item.category_name}</Badge>}</td>
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{item.quantity}</div>
                                <div className="text-xs text-muted-foreground">Min: {item.min_quantity}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-medium">${Number(item.unit_price).toFixed(2)}</span>
                            </td>
                            <td className="p-4">
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </td>
                            <td className="p-4">
                              <span className="text-sm">{item.location_name}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setScannedItem(item)
                                    setIsItemResultOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-700">
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
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Previous
                </Button>

                {/* First page and leading ellipsis if needed */}
                {totalPages > 5 && currentPage > 3 && (
                  <>
                    <Button variant={1 === currentPage ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(1)}>
                      1
                    </Button>
                    {currentPage > 3 && <span className="px-2">…</span>}
                  </>
                )}

                {renderPageButtons().map((pageNum) => (
                  <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)}>
                    {pageNum}
                  </Button>
                ))}

                {/* Trailing ellipsis and last page */}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2">…</span>
                    <Button variant={currentPage === totalPages ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(totalPages)}>
                      {totalPages}
                    </Button>
                  </>
                )}

                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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
                  {filters.search || filters.category !== "ALL" || filters.location !== "ALL" || filters.stockStatus !== "ALL"
                    ? "Try adjusting your filters"
                    : "Get started by adding your first stock item"}
                </p>
                {!filters.search && filters.category === "ALL" && filters.location === "ALL" && filters.stockStatus === "ALL" && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Item
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Low Stock Tab */}
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
                {inventory
                  .filter((item) => item.quantity <= item.min_quantity)
                  .map((item) => {
                    const status = getStockStatus(item.quantity, item.min_quantity)
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Current: {item.quantity} | Min: {item.min_quantity}
                            {item.location_name && ` | ${item.location_name}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <Button
                            size="sm"
                            onClick={() => {
                              // route to restock movement if you have route (kept similar to first file)
                              // e.g. router.push(`/movements/new?item=${item.id}`)
                            }}
                          >
                            Restock
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                {inventory.filter((item) => item.quantity <= item.min_quantity).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    All items are well stocked!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
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
                    <span className="font-bold">{inventory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-bold">${inventory.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Stock Items:</span>
                    <span className="font-bold text-orange-600">{inventory.filter((item) => item.quantity <= item.min_quantity).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Out of Stock:</span>
                    <span className="font-bold text-red-600">{inventory.filter((item) => item.quantity === 0).length}</span>
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
                  {categoryOptions.map((category) => {
                    const count = inventory.filter((item) => item.category_name === category).length
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

      {/* Dialogs & Barcode Components (unchanged) */}
      <AddStockItemDialogDatabase open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSubmit={handleAddItem} categories={categories} locations={locations} suppliers={suppliers} />

      <BarcodeScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onItemFound={(item) => {
          const stockItem: StockItem = {
            id: item.id,
            name: item.name,
            description: item.description ?? "",
            quantity: item.quantity ?? 0,
            unit_price: item.unit_price ?? 0,
            min_quantity: 0,
            status: item.status ?? "in_stock",
            barcode: item.barcode ?? "",
            category_id: "",
            subcategory_id: "",
            location_id: "",
            category_name: "",
            subcategory_name: "",
            location_name: "",
            location_code: "",
            created_by_name: "",
            created_at: "",
            updated_at: "",
          }
          handleItemFound(stockItem)
        }}
        onItemNotFound={handleItemNotFound}
        inventory={inventory.map((item) => ({
          ...item,
          location: item.location_name ?? "",
          category: item.category_name ?? "",
          subcategory: item.subcategory_name ?? "",
        }))}
      />

      <BarcodeGenerator open={isBarcodeGeneratorOpen} onOpenChange={setIsBarcodeGeneratorOpen} itemId={selectedItemForBarcode?.id} itemName={selectedItemForBarcode?.name} defaultBarcode={selectedItemForBarcode?.barcode} />

      <ItemLookupResult
        open={isItemResultOpen}
        onOpenChange={setIsItemResultOpen}
        item={
          scannedItem
            ? {
                ...scannedItem,
                location: scannedItem.location_name ?? "",
                category: scannedItem.category_name ?? "",
                subcategory: scannedItem.subcategory_name ?? "",
              }
            : null
        }
        onGenerateBarcode={(item) => {
          const stockItem: StockItem = {
            id: item.id,
            name: item.name,
            description: item.description ?? "",
            quantity: item.quantity ?? 0,
            unit_price: item.unit_price ?? 0,
            min_quantity: 0,
            status: item.status ?? "in_stock",
            barcode: item.barcode ?? "",
            category_id: "",
            subcategory_id: "",
            location_id: "",
            category_name: "",
            subcategory_name: "",
            location_name: "",
            location_code: "",
            created_by_name: "",
            created_at: "",
            updated_at: "",
          }
          handleGenerateBarcode(stockItem)
        }}
      />

      <ItemNotFound open={isItemNotFoundOpen} onOpenChange={setIsItemNotFoundOpen} barcode={notFoundBarcode} onCreateItem={handleCreateItemFromBarcode} onSearchAgain={() => setIsScannerOpen(true)} />

      {/* ----- Inline Edit Modal ----- */}
      {isEditOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setIsEditOpen(false); setEditingItem(null) }} />
          <div className="relative max-w-2xl w-full rounded-md shadow-lg z-10">
            {/* translucent wrapper so dark/light modes don't clash */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Edit Item</h3>
                  <div className="text-sm text-muted-foreground">{editingItem.created_at ? new Date(editingItem.created_at).toLocaleString() : ""}</div>
                </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={editForm.category_id} onValueChange={(v) => setEditForm((s) => ({ ...s, category_id: v, subcategory_id: "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* IMPORTANT: value for an "unspecified" option must NOT be "" */}
                    <SelectItem value="UNSPECIFIED">Unspecified</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                {/* Subcategory select - depends on the selected category */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Subcategory</label>
                  <Select
                    value={editForm.subcategory_id || ""}
                    onValueChange={(v) => setEditForm((s) => ({ ...s, subcategory_id: v }))}
                    disabled={!editForm.category_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={editForm.category_id ? "Select subcategory" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {!editForm.category_id ? (
                        <SelectItem value="__no_sub" disabled>Select a category first</SelectItem>
                      ) : (
                        (categories.find((c) => c.id === editForm.category_id)?.subcategories || []).map((sc) => (
                          <SelectItem key={sc.id} value={sc.id}>
                            {sc.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>


              <div>
                <label className="text-sm font-medium mb-1 block">Location</label>
                <Select value={editForm.location_id} onValueChange={(v) => setEditForm((s) => ({ ...s, location_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* IMPORTANT: value for an "unspecified" option must NOT be "" */}
                    <SelectItem value="UNSPECIFIED">Unspecified</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Unit Price</label>
                <Input type="number" value={String(editForm.unit_price)} onChange={(e) => setEditForm((s) => ({ ...s, unit_price: Number(e.target.value) }))} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Quantity</label>
                <Input type="number" value={String(editForm.quantity)} onChange={(e) => setEditForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Min Quantity</label>
                <Input type="number" value={String(editForm.min_quantity)} onChange={(e) => setEditForm((s) => ({ ...s, min_quantity: Number(e.target.value) }))} />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input value={editForm.description} onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingItem(null) }}>
                Cancel
              </Button>
              <Button onClick={submitEdit}>Save Changes</Button>
            </div>
          </div>
        </div>
        </div>
        </div>
      )}
    </div>
  )
}
function setItems(arg0: (prev: any) => any) {
  throw new Error("Function not implemented.")
}

