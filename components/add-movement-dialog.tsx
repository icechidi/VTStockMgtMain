"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Package, AlertCircle, Search, Scan } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface MovementData {
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

interface AddMovementDialogDatabaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Omit<MovementData, "id" | "created_at">) => void
  stockItems: StockItem[]
  locations: Location[] | any
  users: User[] | any
  suppliers: Supplier[] | any
}

function normalizeArray<T = any>(maybeArray: any): T[] {
  if (!maybeArray) return []
  if (Array.isArray(maybeArray)) return maybeArray
  if (typeof maybeArray === "object") {
    if (Array.isArray(maybeArray.rows)) return maybeArray.rows
    if (Array.isArray(maybeArray.data)) return maybeArray.data
  }
  return []
}

export function AddMovementDialogDatabase({
  open,
  onOpenChange,
  onSubmit,
  stockItems,
  locations,
  users,
  suppliers,
}: AddMovementDialogDatabaseProps) {
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
  const [formData, setFormData] = useState<Partial<MovementData>>({
    movement_type: "IN",
    quantity: 1,
    movement_date: new Date().toISOString().slice(0, 16),
    user_id: (users && Array.isArray(users) && users[0]?.id) || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Normalize potentially non-array props into arrays
  const suppliersList = useMemo(() => normalizeArray<Supplier>(suppliers), [suppliers])
  const usersList = useMemo(() => normalizeArray<User>(users), [users])
  const locationsList = useMemo(() => normalizeArray<Location>(locations), [locations])

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setFormData({
        movement_type: "IN",
        quantity: 1,
        movement_date: new Date().toISOString().slice(0, 16),
        user_id: usersList[0]?.id || "",
      })
      setSelectedItem(null)
      setSearchTerm("")
      setErrors([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, usersList])

  useEffect(() => {
    // Filter items based on search term
    if (searchTerm) {
      const filtered = stockItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredItems(filtered)
    } else {
      setFilteredItems(stockItems.slice(0, 10)) // Show first 10 items by default
    }
  }, [searchTerm, stockItems])

  useEffect(() => {
    // Calculate total value when quantity or unit price changes
    if (formData.quantity && formData.unit_price) {
      setFormData((prev) => ({
        ...prev,
        total_value: formData.quantity! * formData.unit_price!,
      }))
    }
  }, [formData.quantity, formData.unit_price])

  const handleItemSelect = (item: StockItem) => {
    setSelectedItem(item)
    setFormData((prev) => ({
      ...prev,
      item_id: item.id,
      unit_price: item.unit_price,
      location_id: locationsList.find((l) => l.name === item.location_name)?.id || prev.location_id,
    }))
    setSearchTerm("")
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.item_id) newErrors.push("Please select an item")
    if (!formData.quantity || formData.quantity <= 0) newErrors.push("Quantity must be greater than 0")
    if (!formData.user_id) newErrors.push("Please select a user")
    if (!formData.movement_date) newErrors.push("Please select a date and time")

    if (formData.movement_type === "OUT" && selectedItem && formData.quantity! > selectedItem.quantity) {
      newErrors.push(`Cannot remove ${formData.quantity} items. Only ${selectedItem.quantity} available in stock.`)
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await onSubmit(formData as MovementData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting movement:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBarcodeSearch = (barcode: string) => {
    const item = stockItems.find((item) => item.barcode === barcode)
    if (item) {
      handleItemSelect(item)
    } else {
      setErrors(["Item with barcode not found"])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>

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
          <div className="space-y-4">
            <Label>Select Item *</Label>

            {!selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, barcode, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const barcode = prompt("Enter barcode:")
                      if (barcode) handleBarcodeSearch(barcode)
                    }}
                  >
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleItemSelect(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.category_name} • {item.subcategory_name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="font-mono text-xs">
                                {item.barcode}
                              </Badge>
                              <Badge variant="secondary">{item.location_code}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">Stock: {item.quantity}</div>
                            <div className="text-sm text-muted-foreground">${item.unit_price}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredItems.length === 0 && searchTerm && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items found</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{selectedItem.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedItem.category_name} • {selectedItem.subcategory_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {selectedItem.barcode}
                          </Badge>
                          <Badge variant="secondary">{selectedItem.location_code}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">Stock: {selectedItem.quantity}</div>
                      <div className="text-sm text-muted-foreground">${selectedItem.unit_price}</div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 bg-transparent"
                    onClick={() => {
                      setSelectedItem(null)
                      setFormData((prev) => ({ ...prev, item_id: undefined, unit_price: undefined }))
                    }}
                  >
                    Change Item
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {selectedItem && (
            <>
              {/* Movement Type */}
              <div className="space-y-3">
                <Label>Movement Type *</Label>
                <RadioGroup
                  value={formData.movement_type}
                  onValueChange={(value: "IN" | "OUT") => setFormData({ ...formData, movement_type: value })}
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
                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity || ""}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    placeholder="Enter quantity"
                  />
                  {formData.movement_type === "OUT" && selectedItem && formData.quantity! > selectedItem.quantity && (
                    <p className="text-sm text-red-600">
                      Warning: Exceeds available stock ({selectedItem.quantity} units)
                    </p>
                  )}
                </div>

                {/* Unit Price */}
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price ($)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price || ""}
                    onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                    placeholder="Enter unit price"
                  />
                </div>
              </div>

              {/* Total Value */}
              {formData.total_value && (
                <div className="space-y-2">
                  <Label>Total Value</Label>
                  <div className="text-2xl font-bold text-green-600">${formData.total_value.toFixed(2)}</div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Date & Time */}
                <div className="space-y-2">
                  <Label htmlFor="movement_date">Date & Time *</Label>
                  <Input
                    id="movement_date"
                    type="datetime-local"
                    value={formData.movement_date || ""}
                    onChange={(e) => setFormData({ ...formData, movement_date: e.target.value })}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={formData.location_id || ""} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationsList.length === 0 ? (
                        <SelectItem value="">No locations</SelectItem>
                      ) : (
                        locationsList.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name} ({location.code})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* User */}
                <div className="space-y-2">
                  <Label htmlFor="user">User *</Label>
                  <Select value={formData.user_id || ""} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersList.length === 0 ? (
                        <SelectItem value="">No users</SelectItem>
                      ) : (
                        usersList.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reference Number */}
                <div className="space-y-2">
                  <Label htmlFor="reference_number">Reference Number</Label>
                  <Input
                    id="reference_number"
                    value={formData.reference_number || ""}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    placeholder="PO#, Invoice#, etc."
                  />
                </div>
              </div>

              {/* Supplier/Customer */}
              {formData.movement_type === "IN" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Supplier</Label>
                    <Select value={formData.supplier_id || ""} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliersList.length === 0 ? (
                          <SelectItem value="">No suppliers available</SelectItem>
                        ) : (
                          suppliersList.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name} ({supplier.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="received_by">Received By</Label>
                    <Select value={formData.received_by || ""} onValueChange={(value) => setFormData({ ...formData, received_by: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {usersList.length === 0 ? (
                          <SelectItem value="">No users</SelectItem>
                        ) : (
                          usersList.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer/Department</Label>
                  <Input
                    id="customer"
                    value={formData.customer || ""}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    placeholder="Customer or department name"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this movement"
                  rows={3}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedItem}>
              {isSubmitting ? "Recording..." : "Record Movement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- Option A compatibility exports ---
// Provide the symbol your pages import (named) and a default export
export const AddMovementDialog = AddMovementDialogDatabase
export default AddMovementDialogDatabase
