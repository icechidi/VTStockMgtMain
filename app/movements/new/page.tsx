"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ArrowLeft, TrendingUp, TrendingDown, Save, Package, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface StockItem {
  id: number
  name: string
  quantity: number
  unit_price: number
  location?: string
}

interface MovementData {
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
}

const locations = ["Main Warehouse", "Store A", "Store B", "Distribution Center", "Office Storage"]

export default function NewMovementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [items, setItems] = useState<StockItem[]>([])
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const [formData, setFormData] = useState<Partial<MovementData>>({
    movement_type: "IN",
    quantity: 0,
    movement_date: new Date().toISOString().slice(0, 16),
    location: "Main Warehouse",
    user_name: "Admin User",
  })

  useEffect(() => {
    fetchItems()

    // Pre-select item if provided in URL params
    const itemId = searchParams.get("item")
    if (itemId) {
      setFormData((prev) => ({ ...prev, item_id: Number(itemId) }))
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedItem && formData.quantity && formData.unit_price) {
      setFormData((prev) => ({
        ...prev,
        total_value: formData.quantity! * formData.unit_price!,
      }))
    }
  }, [selectedItem, formData.quantity, formData.unit_price])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items")
      if (response.ok) {
        const data = await response.json()
        setItems(data)

        // Auto-select item if provided in URL
        const itemId = searchParams.get("item")
        if (itemId) {
          const item = data.find((i: StockItem) => i.id === Number(itemId))
          if (item) {
            handleItemSelect(itemId)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }

  const handleItemSelect = (itemId: string) => {
    const item = items.find((i) => i.id === Number(itemId))
    if (item) {
      setSelectedItem(item)
      setFormData((prev) => ({
        ...prev,
        item_id: item.id,
        item_name: item.name,
        unit_price: item.unit_price,
        location: item.location || prev.location,
      }))
    }
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.item_id) newErrors.push("Please select an item")
    if (!formData.quantity || formData.quantity <= 0) newErrors.push("Quantity must be greater than 0")
    if (formData.movement_type === "OUT" && selectedItem && formData.quantity! > selectedItem.quantity) {
      newErrors.push(`Cannot remove ${formData.quantity} items. Only ${selectedItem.quantity} available in stock.`)
    }
    if (!formData.movement_date) newErrors.push("Please select a date and time")

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newMovement = await response.json()
        toast({
          title: "Success",
          description: `Stock movement recorded successfully`,
        })
        router.push("/movements")
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to record movement")
      }
    } catch (error) {
      console.error("Error recording movement:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record stock movement",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof MovementData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <Link href="/movements">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Movements
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Record Stock Movement</h2>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Movement Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Item Selection */}
              <div className="space-y-2">
                <Label htmlFor="item">Select Item *</Label>
                <Select value={formData.item_id?.toString() || ""} onValueChange={handleItemSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Stock: {item.quantity} | ${item.unit_price}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Stock Info */}
              {selectedItem && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{selectedItem.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Current Stock: {selectedItem.quantity} units | Unit Price: ${selectedItem.unit_price}
                          {selectedItem.location && ` | Location: ${selectedItem.location}`}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Movement Type */}
              <div className="space-y-3">
                <Label>Movement Type *</Label>
                <RadioGroup
                  value={formData.movement_type}
                  onValueChange={(value: "IN" | "OUT") => handleInputChange("movement_type", value)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="IN" id="in" className="peer sr-only" />
                    <Label
                      htmlFor="in"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <TrendingUp className="mb-3 h-6 w-6 text-green-600" />
                      <div className="text-center">
                        <div className="font-medium">Stock In</div>
                        <div className="text-sm text-muted-foreground">Add items to inventory</div>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="OUT" id="out" className="peer sr-only" />
                    <Label
                      htmlFor="out"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <TrendingDown className="mb-3 h-6 w-6 text-red-600" />
                      <div className="text-center">
                        <div className="font-medium">Stock Out</div>
                        <div className="text-sm text-muted-foreground">Remove items from inventory</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity || ""}
                    onChange={(e) => handleInputChange("quantity", Number(e.target.value))}
                    placeholder="Enter quantity"
                  />
                  {formData.movement_type === "OUT" && selectedItem && formData.quantity! > selectedItem.quantity && (
                    <p className="text-sm text-red-600">
                      Warning: Exceeds available stock ({selectedItem.quantity} units)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price ($)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price || ""}
                    onChange={(e) => handleInputChange("unit_price", Number(e.target.value))}
                    placeholder="Enter unit price"
                  />
                </div>
              </div>

              {formData.total_value && (
                <div className="space-y-2">
                  <Label>Total Value</Label>
                  <div className="text-2xl font-bold text-green-600">${formData.total_value.toFixed(2)}</div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="movement_date">Date & Time *</Label>
                  <Input
                    id="movement_date"
                    type="datetime-local"
                    value={formData.movement_date || ""}
                    onChange={(e) => handleInputChange("movement_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location || ""}
                    onValueChange={(value) => handleInputChange("location", value)}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={formData.reference_number || ""}
                  onChange={(e) => handleInputChange("reference_number", e.target.value)}
                  placeholder="PO#, Invoice#, etc."
                />
              </div>

              {formData.movement_type === "IN" ? (
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier || ""}
                    onChange={(e) => handleInputChange("supplier", e.target.value)}
                    placeholder="Supplier name"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer/Department</Label>
                  <Input
                    id="customer"
                    value={formData.customer || ""}
                    onChange={(e) => handleInputChange("customer", e.target.value)}
                    placeholder="Customer or department name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional notes about this movement"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Link href="/movements">
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Recording..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Record Movement
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
