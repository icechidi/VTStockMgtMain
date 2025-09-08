"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Plus, Search, MapPin, Tag, BarChart3, Loader2, QrCode, Scan } from "lucide-react"
import { AddStockItemDialogDatabase } from "@/components/add-stock-item-dialog-database"
import { CategoryManagementDatabase } from "@/components/category-management-database"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { BarcodeGenerator } from "@/components/barcode-generator"
import { ItemLookupResult } from "@/components/item-lookup-result"
import { ItemNotFound } from "@/components/item-not-found"

export interface StockItem {
  id: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  min_quantity: number
  status: "in_stock" | "low_stock" | "out_of_stock"
  barcode: string
  category_id: string
  subcategory_id: string
  location_id: string
  category_name: string
  subcategory_name: string
  location_name: string
  location_code: string
  created_by_name: string
  created_at: string
  updated_at: string
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

export default function InventoryPageDatabase() {
  const [inventory, setInventory] = useState<StockItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isBarcodeGeneratorOpen, setIsBarcodeGeneratorOpen] = useState(false)
  const [isItemResultOpen, setIsItemResultOpen] = useState(false)
  const [isItemNotFoundOpen, setIsItemNotFoundOpen] = useState(false)

  // Scanner states
  const [scannedItem, setScannedItem] = useState<StockItem | null>(null)
  const [notFoundBarcode, setNotFoundBarcode] = useState("")
  const [selectedItemForBarcode, setSelectedItemForBarcode] = useState<StockItem | null>(null)

  useEffect(() => { fetchData() }, [])

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

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (locationFilter !== "all") params.append("location", locationFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/stock-items?${params}`)
      if (response.ok) {
        const data = await response.json()
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
    } catch (error) { console.error(error) }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations")
      if (response.ok) setLocations(await response.json())
    } catch (error) { console.error(error) }
  }

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => { fetchInventory() }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, locationFilter, categoryFilter, statusFilter])

  // Other handlers (Add, Scan, Barcode, etc.)
  const handleAddItem = async (data: any) => {
    try {
      const response = await fetch("/api/stock-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setIsAddDialogOpen(false)
        fetchInventory()
      }
    } catch (error) { console.error(error) }
  }

  const handleItemFound = (item: StockItem) => { setScannedItem(item); setIsItemResultOpen(true) }
  const handleItemNotFound = (barcode: string) => { setNotFoundBarcode(barcode); setIsItemNotFoundOpen(true) }
  const handleScanBarcode = async (barcode: string) => {
    try {
      const response = await fetch(`/api/stock-items/barcode/${barcode}`)
      if (response.ok) handleItemFound(await response.json())
      else handleItemNotFound(barcode)
    } catch { handleItemNotFound(barcode) }
  }
  const handleCreateItemFromBarcode = (barcode: string) => { setIsAddDialogOpen(true); setIsItemNotFoundOpen(false) }
  const handleGenerateBarcode = (item: StockItem) => { setSelectedItemForBarcode(item); setIsBarcodeGeneratorOpen(true); setIsItemResultOpen(false) }
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case "in_stock": return "default"
      case "low_stock": return "secondary"
      case "out_of_stock": return "destructive"
      default: return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading inventory...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add & Scan */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">Track your stock items with barcode scanning capabilities</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsScannerOpen(true)} variant="outline"><Scan className="mr-2 h-4 w-4" />Scan Barcode</Button>
          <Button onClick={() => setIsAddDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Item</Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Items</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{inventory.length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Total Value</CardTitle><BarChart3 className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">${inventory.reduce((sum,item)=>sum+item.unit_price*item.quantity,0).toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Low Stock</CardTitle><Package className="h-4 w-4 text-yellow-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{inventory.filter(i=>i.status==="low_stock").length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Out of Stock</CardTitle><Package className="h-4 w-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{inventory.filter(i=>i.status==="out_of_stock").length}</div></CardContent></Card>
      </div>

      {/* Tabs (Inventory / Locations / Categories / Manage Categories) */}
{/* Tabs for Inventory, Locations, Categories */}
<Tabs defaultValue="inventory" className="space-y-4">
  <TabsList>
    <TabsTrigger value="inventory">Inventory</TabsTrigger>
    <TabsTrigger value="locations">Locations</TabsTrigger>
    <TabsTrigger value="categories">Categories</TabsTrigger>
    <TabsTrigger value="manage-categories">Manage Categories</TabsTrigger>
  </TabsList>

  {/* Inventory Tab */}
  <TabsContent value="inventory" className="space-y-4">
    {/* Filters */}
    <div className="flex flex-wrap gap-2 items-center">
      <Input
        placeholder="Search by name or barcode..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <Select value={locationFilter} onValueChange={setLocationFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="in_stock">In Stock</SelectItem>
          <SelectItem value="low_stock">Low Stock</SelectItem>
          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Inventory Cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {inventory.map(item => (
        <Card key={item.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
            <Badge variant={getStatusBadgeVariant(item.status)}>{item.status.replace("_", " ")}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <div className="flex justify-between text-sm">
              <span>Qty: {item.quantity}</span>
              <span>Price: ${Number(item.unit_price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Location: {item.location_name}</span>
              <span>Category: {item.category_name}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => handleGenerateBarcode(item)}>
                <QrCode className="h-4 w-4 mr-1" />Barcode
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </TabsContent>

  {/* Locations Tab */}
  <TabsContent value="locations">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {locations.map(loc => (
        <Card key={loc.id}>
          <CardHeader>
            <CardTitle>{loc.name}</CardTitle>
            <CardDescription>{loc.type} | {loc.block}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between">
            <span>Capacity: {loc.capacity}</span>
            <span>Items: {loc.current_items}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  </TabsContent>

  {/* Categories Tab */}
  <TabsContent value="categories">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map(cat => (
        <Card key={cat.id}>
          <CardHeader>
            <CardTitle>{cat.name}</CardTitle>
            <CardDescription>{cat.subcategories.length} subcategories</CardDescription>
          </CardHeader>
          <CardContent>
            {cat.subcategories.map(sub => (
              <Badge key={sub.id} variant="secondary" className="mr-1 mb-1">{sub.name}</Badge>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  </TabsContent>

  {/* Manage Categories Tab */}
  <TabsContent value="manage-categories">
    <CategoryManagementDatabase
      categories={categories}
      onCategoriesChange={fetchCategories}
    />
  </TabsContent>
</Tabs>


      {/* Filtered views, card/table displays, analytics, and dialogs will go here */}

      {/* ==========================
     Dialogs and Barcode Components
========================== */}
<AddStockItemDialogDatabase
  open={isAddDialogOpen}
  onOpenChange={setIsAddDialogOpen}
  onSubmit={handleAddItem}
  categories={categories}
  locations={locations}
/>

<BarcodeScanner
  open={isScannerOpen}
  onOpenChange={setIsScannerOpen}
  onItemFound={(item) => {
    // Map ScannedItem to StockItem shape (fill missing fields with defaults or empty values)
    const stockItem: StockItem = {
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      quantity: item.quantity ?? 0,
      unit_price: item.unit_price ?? 0,
      //unit_price: Number(item.unit_price ?? 0).toFixed(2) as unknown as number,
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
  inventory={inventory.map(item => ({
    ...item,
    location: item.location_name ?? "",
    category: item.category_name ?? "",
    subcategory: item.subcategory_name ?? "",
  }))}
/>

<BarcodeGenerator
  open={isBarcodeGeneratorOpen}
  onOpenChange={setIsBarcodeGeneratorOpen}
  itemId={selectedItemForBarcode?.id}
  itemName={selectedItemForBarcode?.name}
  defaultBarcode={selectedItemForBarcode?.barcode}
/>

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
  onGenerateBarcode={
    (item) => {
      // Convert ScannedItem to StockItem shape (fill missing fields with defaults or empty values)
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
    }
  }
/>

<ItemNotFound
  open={isItemNotFoundOpen}
  onOpenChange={setIsItemNotFoundOpen}
  barcode={notFoundBarcode}
  onCreateItem={handleCreateItemFromBarcode}
  onSearchAgain={() => setIsScannerOpen(true)}
/>

    </div>
  )
}
