"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StockItemData {
  name: string
  description?: string
  quantity: number
  unit_price: number
  min_quantity: number
  location_id?: string
  category_id?: string
  subcategory_id?: string
  supplier_id?: string
  barcode?: string
}

interface Category {
  id: string
  name: string
  description?: string
  subcategories: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  description?: string
}

interface Location {
  id: string
  name: string
  code: string
}

interface Supplier {
  id: string
  name: string
  code: string
}

interface AddStockItemDialogDatabaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: StockItemData) => void
  categories: Category[]
  locations: Location[]
  suppliers: Supplier[]
}

export function AddStockItemDialogDatabase({
  open,
  onOpenChange,
  onSubmit,
  categories,
  locations,
  suppliers,
}: AddStockItemDialogDatabaseProps) {
  const [formData, setFormData] = useState<StockItemData>({
    name: "",
    description: "",
    quantity: 0,
    unit_price: 0,
    min_quantity: 10,
    location_id: "",
    category_id: "",
    subcategory_id: "",
    supplier_id: "",
    barcode: "",
  })
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubCategory, setSelectedSubCategory] = useState("")
  const [showTemplates, setShowTemplates] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const itemTemplates = [
    {
      id: 1,
      name: "Desktop Computer",
      description: "Standard office desktop computer with monitor, keyboard, and mouse",
      unit_price: 800,
      min_quantity: 5,
      category: "Hardware",
      subcategory: "System Unit",
    },
    {
      id: 2,
      name: "Business Laptop",
      description: "Business laptop for mobile work",
      unit_price: 1200,
      min_quantity: 10,
      category: "Hardware",
      subcategory: "System Unit",
    },
    {
      id: 3,
      name: 'Monitor 24"',
      description: "24-inch LED monitor for workstation",
      unit_price: 250,
      min_quantity: 8,
      category: "Hardware",
      subcategory: "Monitors",
    },
    {
      id: 4,
      name: "Wireless Mouse",
      description: "Ergonomic wireless optical mouse",
      unit_price: 25,
      min_quantity: 20,
      category: "Accessories",
      subcategory: "Mouse",
    },
    {
      id: 5,
      name: "Mechanical Keyboard",
      description: "Professional mechanical keyboard",
      unit_price: 120,
      min_quantity: 15,
      category: "Accessories",
      subcategory: "Keyboard",
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const selectedCategoryObj = categories.find((c) => c.id === selectedCategory)
      const selectedSubcategoryObj = selectedCategoryObj?.subcategories.find((s) => s.id === selectedSubCategory)

      await onSubmit({
        ...formData,
        category_id: selectedCategory,
        subcategory_id: selectedSubCategory,
        barcode: formData.barcode || `BC${Date.now().toString().slice(-6)}`,
      })

      // Reset form
      setFormData({
        name: "",
        description: "",
        quantity: 0,
        unit_price: 0,
        min_quantity: 10,
        location_id: "",
        category_id: "",
        subcategory_id: "",
        supplier_id: "",
        barcode: "",
      })
      setSelectedCategory("")
      setSelectedSubCategory("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTemplateSelect = (template: (typeof itemTemplates)[0]) => {
    const category = categories.find((c) => c.name === template.category)
    const subcategory = category?.subcategories.find((s) => s.name === template.subcategory)

    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      unit_price: template.unit_price,
      min_quantity: template.min_quantity,
    })

    if (category) {
      setSelectedCategory(category.id)
      if (subcategory) {
        setSelectedSubCategory(subcategory.id)
      }
    }
    setShowTemplates(false)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setSelectedSubCategory("") // reset subcategory when category changes
  }

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Stock Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Button type="button" variant="outline" onClick={() => setShowTemplates(!showTemplates)} className="mb-4">
              {showTemplates ? "Hide" : "Show"} Item Templates
            </Button>

            {showTemplates && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Add Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 max-h-60 overflow-y-auto">
                    {itemTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                {template.category}
                              </span>
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                {template.subcategory}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-medium">${template.unit_price}</div>
                            <div className="text-xs text-muted-foreground">Min: {template.min_quantity}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory} disabled={!selectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategoryObj?.subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} ({location.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">Initial Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price ($) *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_quantity">Minimum Quantity</Label>
                <Input
                  id="min_quantity"
                  type="number"
                  min="0"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
