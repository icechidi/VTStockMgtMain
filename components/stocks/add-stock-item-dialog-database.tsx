// components/add-stock-item-dialog.tsx
"use client"

import React, { useEffect, useMemo, useState } from "react"
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

interface Subcategory {
  id: string
  name: string
  description?: string
}

interface Category {
  id: string
  name: string
  description?: string
  subcategories: Subcategory[]
}

interface Location {
  id: string
  name: string
  code: string
}

interface Supplier {
  id: string | number
  name: string
  code?: string
}

interface AddStockItemDialogDatabaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: StockItemData) => Promise<void> | void
  categories: Category[]
  locations?: Location[] | { rows?: Location[] } | { data?: Location[] } | any
  suppliers?: Supplier[] | { suppliers?: Supplier[] } | { rows?: Supplier[] } | { data?: Supplier[] } | any
}

/**
 * Normalizes different shapes to a plain array:
 * - array
 * - { rows: [...] }
 * - { data: [...] }
 * - { suppliers: [...] }
 */
function normalizeArray<T = any>(maybeArray: any): T[] {
  if (!maybeArray) return []
  if (Array.isArray(maybeArray)) return maybeArray
  if (typeof maybeArray === "object" && maybeArray !== null) {
    if (Array.isArray(maybeArray.rows)) return maybeArray.rows
    if (Array.isArray(maybeArray.data)) return maybeArray.data
    if (Array.isArray(maybeArray.suppliers)) return maybeArray.suppliers
    if (Array.isArray(maybeArray.locations)) return maybeArray.locations
  }
  return []
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
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("")
  const [showTemplates, setShowTemplates] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const locationsList = useMemo(() => normalizeArray<Location>(locations), [locations])
  const suppliedSuppliers = useMemo(() => normalizeArray<Supplier>(suppliers), [suppliers])

  // local suppliers state (init from props). If empty we try a one-time fetch from /api/suppliers
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(suppliedSuppliers)

  useEffect(() => {
    setLocalSuppliers(suppliedSuppliers)
  }, [suppliedSuppliers])

  useEffect(() => {
    // If parent didn't provide suppliers, try fetching once when dialog opens
    if (open && localSuppliers.length === 0) {
      let mounted = true
      ;(async () => {
        try {
          const res = await fetch("/api/suppliers")
          if (!res.ok) return
          const json = await res.json()
          const normalized = normalizeArray<Supplier>(json)
          if (mounted && normalized.length > 0) setLocalSuppliers(normalized)
        } catch (err) {
          // fail silently — optional endpoint
        }
      })()
      return () => {
        mounted = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Keep category/subcategory in sync with formData
  useEffect(() => {
    setFormData((prev) => ({ ...prev, category_id: selectedCategory || undefined }))
  }, [selectedCategory])

  useEffect(() => {
    setFormData((prev) => ({ ...prev, subcategory_id: selectedSubCategory || undefined }))
  }, [selectedSubCategory])

  // Set sensible defaults when lists change
  useEffect(() => {
    if (locationsList.length > 0 && !formData.location_id) {
      setFormData((prev) => ({ ...prev, location_id: String(locationsList[0].id) }))
    }
  }, [locationsList]) // eslint-disable-line

  useEffect(() => {
    if (localSuppliers.length > 0 && !formData.supplier_id) {
      setFormData((prev) => ({ ...prev, supplier_id: String(localSuppliers[0].id) }))
    }
  }, [localSuppliers]) // eslint-disable-line

  const itemTemplates = [
    {
      id: 1,
      name: "Desktop Computer",
      description: "Standard office desktop with monitor",
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
      description: "24-inch LED monitor",
      unit_price: 250,
      min_quantity: 8,
      category: "Hardware",
      subcategory: "Monitors",
    },
    {
      id: 4,
      name: "Wireless Mouse",
      description: "Ergonomic wireless mouse",
      unit_price: 25,
      min_quantity: 20,
      category: "Accessories",
      subcategory: "Mouse",
    },
  ] as const

  const handleTemplateSelect = (t: typeof itemTemplates[number]) => {
    const cat = categories.find((c) => c.name === t.category)
    const sub = cat?.subcategories.find((s) => s.name === t.subcategory)

    setFormData((prev) => ({
      ...prev,
      name: t.name,
      description: t.description,
      unit_price: t.unit_price,
      min_quantity: t.min_quantity,
    }))
    if (cat) setSelectedCategory(cat.id)
    if (sub) setSelectedSubCategory(sub.id)
    setShowTemplates(false)
  }

  const validate = () => {
    const errs: string[] = []
    if (!formData.name || formData.name.trim() === "") errs.push("Item name is required")
    if (formData.quantity < 0) errs.push("Quantity cannot be negative")
    if (formData.unit_price < 0) errs.push("Unit price cannot be negative")
    setErrors(errs)
    return errs.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)

    try {
      const payload: StockItemData = {
        ...formData,
        category_id: selectedCategory || undefined,
        subcategory_id: selectedSubCategory || undefined,
        barcode: formData.barcode || `BC${Date.now().toString().slice(-6)}`,
      }
      // Ensure supplier/location ids are strings or undefined
      if (payload.supplier_id) payload.supplier_id = String(payload.supplier_id)
      if (payload.location_id) payload.location_id = String(payload.location_id)

      await onSubmit(payload)

      // Reset
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
      setErrors([])
      onOpenChange(false)
    } catch (err) {
      console.error("Error adding item:", err)
      setErrors(["Failed to add item. See console for details."])
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Stock Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-2">
          <div>
            <Button type="button" variant="outline" onClick={() => setShowTemplates((s) => !s)} className="mb-4">
              {showTemplates ? "Hide" : "Show"} Item Templates
            </Button>

            {showTemplates && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Add Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 max-h-60 overflow-y-auto">
                    {itemTemplates.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleTemplateSelect(t)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{t.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{t.category}</span>
                              <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{t.subcategory}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-medium">${t.unit_price}</div>
                            <div className="text-xs text-muted-foreground">Min: {t.min_quantity}</div>
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
            {errors.length > 0 && (
              <div className="rounded bg-red-50 border border-red-200 p-2 text-sm text-red-700">
                <ul className="list-disc list-inside">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
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
                <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      // c.id must be non-empty; assume categories are valid
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select value={selectedSubCategory} onValueChange={(v) => setSelectedSubCategory(v)} disabled={!selectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedCategoryObj?.subcategories || []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location_id || "__no-location"}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, location_id: value === "__no-location" ? "" : String(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locationsList.length === 0 ? (
                    <SelectItem value="__no-location" disabled>
                      No locations available
                    </SelectItem>
                  ) : (
                    locationsList.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.name} ({loc.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={formData.supplier_id || "__no-supplier"}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier_id: value === "__no-supplier" ? "" : String(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {localSuppliers.length === 0 ? (
                    <SelectItem value="__no-supplier" disabled>
                      No suppliers available
                    </SelectItem>
                  ) : (
                    localSuppliers.map((s) => (
                      <SelectItem key={String(s.id)} value={String(s.id)}>
                        {s.name} {s.code ? `(${s.code})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">Initial Quantity *</Label>
                <Input id="quantity" type="number" min={0} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price ($) *</Label>
                <Input id="unit_price" type="number" min={0} step="0.01" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_quantity">Minimum Quantity</Label>
                <Input id="min_quantity" type="number" min={0} value={formData.min_quantity} onChange={(e) => setFormData({ ...formData, min_quantity: Number(e.target.value) })} />
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

export default AddStockItemDialogDatabase
