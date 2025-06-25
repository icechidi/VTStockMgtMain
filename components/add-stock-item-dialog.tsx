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
  location?: string
  category?: string
}

interface AddStockItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: StockItemData) => void
}

const itemTemplates = [
  {
    id: 1,
    name: "Desktop Computer",
    description: "Standard office desktop computer with monitor, keyboard, and mouse",
    unit_price: 800,
    min_quantity: 5,
    category: "Hardware",
  },
  {
    id: 2,
    name: "Laptop",
    description: "Business laptop for mobile work",
    unit_price: 1200,
    min_quantity: 10,
    category: "Hardware",
  },
  {
    id: 3,
    name: 'Monitor 24"',
    description: "24-inch LED monitor for workstation",
    unit_price: 250,
    min_quantity: 8,
    category: "Hardware",
  },
  {
    id: 4,
    name: "Wireless Mouse",
    description: "Ergonomic wireless optical mouse",
    unit_price: 25,
    min_quantity: 20,
    category: "Accessories",
  },
  {
    id: 5,
    name: "Mechanical Keyboard",
    description: "Professional mechanical keyboard",
    unit_price: 120,
    min_quantity: 15,
    category: "Accessories",
  },
]

const categories = ["Hardware", "Software", "Accessories", "Networking", "Storage", "Printers", "Cables"]
const locations = ["Main Warehouse", "Store A", "Store B", "Distribution Center"]

export function AddStockItemDialog({ open, onOpenChange, onSubmit }: AddStockItemDialogProps) {
  const [formData, setFormData] = useState<StockItemData>({
    name: "",
    description: "",
    quantity: 0,
    unit_price: 0,
    min_quantity: 10,
    location: "Main Warehouse",
    category: "",
  })
  const [showTemplates, setShowTemplates] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      setFormData({
        name: "",
        description: "",
        quantity: 0,
        unit_price: 0,
        min_quantity: 10,
        location: "Main Warehouse",
        category: "",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTemplateSelect = (template: (typeof itemTemplates)[0]) => {
    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      unit_price: template.unit_price,
      min_quantity: template.min_quantity,
      category: template.category,
    })
    setShowTemplates(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-medium">${template.unit_price}</div>
                            <div className="text-xs text-muted-foreground">{template.category}</div>
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
