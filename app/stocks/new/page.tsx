"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ArrowLeft, Package, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface StockItemData {
  name: string
  description?: string
  category?: string
  unit_price: number
  quantity: number
  min_quantity: number
  max_quantity?: number
  location?: string
}

const categoriesWithSub: Record<string, string[]> = {
  Hardware: ["Monitors", "System Unit", "Motherboard", "RAM", "CPU"],
  Software: ["Operating System", "Productivity", "Security"],
  Accessories: ["Mouse", "Keyboard", "Webcam"],
  Networking: ["Routers", "Switches", "Cables"],
  Storage: ["SSD", "HDD", "USB Drive", "SD Card", "External Drive", "NAS", "Cloud Storage"],
  Printers: ["Laser", "Inkjet", "Supplies", "Toner", "Ink Cartridges", "Xerox"],
  Cables: ["HDMI", "Ethernet", "Power"],
  "Office Supplies": ["Paper", "Pens", "Folders"],
}

const categories = Object.keys(categoriesWithSub)

// Remove useState hooks from here. The category/subcategory logic should be inside the component.

const locations = [
    "B-Block-SR0",
    "B-Block-SR1", 
    "B-Block-SR2", 
    "B-Block-SR3", 
    "B-Block-SR4", 
    "A-Block-SR0", 
    "A-Block-SR1",
    "A-Block-SR2", 
    "Office Storage"
]

export default function NewStockItemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Move category/subcategory state here
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubCategory, setSelectedSubCategory] = useState("")

  const [formData, setFormData] = useState<StockItemData>({
    name: "",
    description: "",
    category: "",
    unit_price: 0,
    quantity: 0,
    min_quantity: 10,
    max_quantity: undefined,
    location: "Main Warehouse",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newItem = await response.json()
        toast({
          title: "Success",
          description: `Stock item "${newItem.name}" created successfully`,
        })
        router.push("/stocks")
      } else {
        toast({
          title: "Error",
          description: "Failed to create stock item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof StockItemData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <Link href="/stocks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stock Items
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Add New Stock Item</h2>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Item Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter item name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value)
                      setSelectedSubCategory("")
                      handleInputChange("category", value)
                    }}
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
                  {selectedCategory && (
                    <Select
                      value={selectedSubCategory}
                      onValueChange={(value) => {
                        setSelectedSubCategory(value)
                        // Optionally, you can store subcategory in formData if needed
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesWithSub[selectedCategory].map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price *</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => handleInputChange("unit_price", Number(e.target.value))}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", Number(e.target.value))}
                    placeholder="0"
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
                    onChange={(e) => handleInputChange("min_quantity", Number(e.target.value))}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max_quantity">Maximum Quantity (Optional)</Label>
                  <Input
                    id="max_quantity"
                    type="number"
                    min="0"
                    value={formData.max_quantity || ""}
                    onChange={(e) =>
                      handleInputChange("max_quantity", e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="Leave empty for no limit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
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
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Link href="/stocks">
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Item
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
