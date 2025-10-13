// components/edit-movement-dialog.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface StockMovement {
  id: number | string
  item_id?: number | string
  item_name?: string
  movement_type: "IN" | "OUT"
  quantity: number
  unit_price?: number | null
  total_value?: number | null
  notes?: string | null
  location?: string | null
  location_id?: string | null
  user_name?: string | null
  reference_number?: string | null
  supplier?: string | null
  supplier_id?: string | null
  customer?: string | null
  movement_date: string
  created_at?: string
}

interface Location {
  id: string
  name: string
  code?: string
}

interface Supplier {
  id: string
  name: string
  code?: string
}

interface EditMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movement: StockMovement | null
  locations?: Location[] | any | null
  suppliers?: Supplier[] | any | null
  // <-- IMPORTANT: parent (MovementsPage) expects this to receive the payload only
  onSubmit: (payload: Partial<StockMovement>) => Promise<void> | void
}

const UNSPECIFIED = "UNSPECIFIED" // sentinel value for Select components

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v)
}

/** Normalize various API shapes into an array */
function normalizeArray<T = any>(maybeArray: any): T[] {
  if (!maybeArray) return []
  if (Array.isArray(maybeArray)) return maybeArray
  if (typeof maybeArray === "object" && maybeArray !== null) {
    if (Array.isArray(maybeArray.rows)) return maybeArray.rows
    if (Array.isArray(maybeArray.data)) return maybeArray.data
    if (Array.isArray(maybeArray.items)) return maybeArray.items
    // sometimes API returns { suppliers: [...] } or similar
    const keys = Object.keys(maybeArray)
    for (const k of keys) {
      if (Array.isArray((maybeArray as any)[k])) return (maybeArray as any)[k]
    }
  }
  return []
}

export function EditMovementDialog({
  open,
  onOpenChange,
  movement,
  locations = [],
  suppliers = [],
  onSubmit,
}: EditMovementDialogProps) {
  const [formData, setFormData] = useState<Partial<StockMovement>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // defensive normalization
  const locationsList = normalizeArray<Location>(locations)
  const suppliersList = normalizeArray<Supplier>(suppliers)

  // Helper: convert ISO => value for datetime-local input
  const toInputDateTime = (iso?: string) => {
    if (!iso) return new Date().toISOString().slice(0, 16)
    const d = new Date(iso)
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 16)
    // use slice(0,16) so the value is "YYYY-MM-DDTHH:mm"
    return d.toISOString().slice(0, 16)
  }

  // populate form when movement or supporting lists change
  useEffect(() => {
    if (!movement) {
      setFormData({})
      return
    }

    // attempt to find supplier_id from suppliersList if only name/code is on movement
    let supplierId: string | undefined
    if (movement.supplier_id) {
      supplierId = String(movement.supplier_id)
    } else if (movement.supplier) {
      const match =
        suppliersList.find(
          (s) =>
            String(s.id) === String(movement.supplier) ||
            s.name === movement.supplier ||
            (s.code && s.code === movement.supplier),
        ) ?? undefined
      supplierId = match?.id
    }

    // attempt to find location_id similarly
    let locationId: string | undefined
    if ((movement as any).location_id) {
      locationId = String((movement as any).location_id)
    } else if (movement.location) {
      const match =
        locationsList.find(
          (l) =>
            String(l.id) === String(movement.location) ||
            l.name === movement.location ||
            (l.code && l.code === movement.location),
        ) ?? undefined
      locationId = match?.id
    }

    setFormData({
      quantity: Number.isFinite(Number(movement.quantity)) ? Number(movement.quantity) : 0,
      unit_price:
        movement.unit_price === undefined || movement.unit_price === null
          ? undefined
          : Number(movement.unit_price),
      total_value:
        Number.isFinite(Number(movement.quantity)) && Number.isFinite(Number(movement.unit_price || 0))
          ? Number(movement.quantity) * Number(movement.unit_price || 0)
          : movement.total_value ?? undefined,
      notes: movement.notes ?? undefined,
      location_id: locationId ?? (UNSPECIFIED as unknown as string),
      supplier_id: supplierId ?? (UNSPECIFIED as unknown as string),
      reference_number: movement.reference_number ?? undefined,
      customer: movement.customer ?? undefined,
      movement_date: toInputDateTime(movement.movement_date),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movement, locationsList.length, suppliersList.length])

  // recompute total_value any time qty or unit_price changes
  useEffect(() => {
    const q = typeof formData.quantity === "number" ? formData.quantity : Number(formData.quantity)
    const up = typeof formData.unit_price === "number" ? formData.unit_price : Number(formData.unit_price as any)
    const qOk = Number.isFinite(q)
    const upOk = Number.isFinite(up)
    setFormData((prev) => ({
      ...prev,
      total_value: qOk && upOk ? q * up : prev.total_value,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.quantity, formData.unit_price])

  const validateForm = () => {
    const newErrors: string[] = []
    const q = typeof formData.quantity === "number" ? formData.quantity : Number(formData.quantity)
    if (!Number.isFinite(q) || q <= 0) newErrors.push("Quantity must be a number greater than 0")
    setErrors(newErrors)
    return newErrors.length === 0
  }

  // When submitting, build the payload and call onSubmit(payload)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movement) return
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const payload: Partial<StockMovement> = {}

      // quantity
      const q = typeof formData.quantity === "number" ? formData.quantity : Number(formData.quantity)
      if (Number.isFinite(q)) payload.quantity = q

      // unit_price
      if (formData.unit_price !== undefined && formData.unit_price !== null) {
        const up = typeof formData.unit_price === "number" ? formData.unit_price : Number(formData.unit_price as any)
        payload.unit_price = Number.isFinite(up) ? up : undefined
      } else {
        payload.unit_price = undefined
      }

      // total_value (computed if possible)
      if (payload.quantity !== undefined && payload.unit_price !== undefined && Number.isFinite(payload.quantity) && Number.isFinite(payload.unit_price)) {
        payload.total_value = payload.quantity * payload.unit_price
      } else if (formData.total_value !== undefined && isFiniteNumber(formData.total_value as any)) {
        payload.total_value = formData.total_value as number
      } else {
        payload.total_value = undefined
      }

      // simple string fields
      const maybeStringFields = ["reference_number", "notes", "customer", "movement_date"] as const
      for (const k of maybeStringFields) {
        const v = (formData as any)[k]
        if (v === undefined || v === null) {
          ;(payload as any)[k] = undefined
        } else {
          const s = String(v).trim()
          ;(payload as any)[k] = s === "" ? undefined : s
        }
      }

      // supplier_id & location_id sentinel handling
      if (formData.supplier_id && formData.supplier_id !== UNSPECIFIED) {
        payload.supplier_id = String(formData.supplier_id)
      } else {
        payload.supplier_id = undefined
      }

      if (formData.location_id && formData.location_id !== UNSPECIFIED) {
        payload.location_id = String(formData.location_id)
      } else {
        payload.location_id = undefined
      }

      // IMPORTANT: call parent with payload only (parent adds the ID)
      await onSubmit(payload)

      setErrors([])
      onOpenChange(false)
    } catch (err) {
      console.error("Edit movement submit error:", err)
      setErrors([String((err as any)?.message ?? "Failed to update movement")])
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayNumber = (v: unknown, decimals = 2) => {
    if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(decimals)
    const n = Number(v as any)
    if (Number.isFinite(n)) return n.toFixed(decimals)
    return null
  }

  // checks for helpful hints if selected ids are not in lists
  const currentLocationId = formData.location_id && formData.location_id !== UNSPECIFIED ? String(formData.location_id) : null
  const currentSupplierId = formData.supplier_id && formData.supplier_id !== UNSPECIFIED ? String(formData.supplier_id) : null
  const locationExists = locationsList && locationsList.length > 0 ? locationsList.some((l) => String(l.id) === currentLocationId) : false
  const supplierExists = suppliersList && suppliersList.length > 0 ? suppliersList.some((s) => String(s.id) === currentSupplierId) : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Movement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity !== undefined ? String(formData.quantity) : ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: e.target.value === "" ? undefined : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price ($)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price !== undefined ? String(formData.unit_price) : ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    unit_price: e.target.value === "" ? undefined : Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {isFiniteNumber(formData.total_value as any) && (
            <div className="space-y-2">
              <Label>Total Value</Label>
              <div className="text-2xl font-bold text-green-600">${displayNumber(formData.total_value as any, 2)}</div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="movement_date">Date & Time</Label>
              <Input
                id="movement_date"
                type="datetime-local"
                value={formData.movement_date ?? ""}
                onChange={(e) => setFormData({ ...formData, movement_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={(formData.location_id ?? UNSPECIFIED) as string} onValueChange={(value) => setFormData((prev) => ({ ...prev, location_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSPECIFIED}>Unspecified</SelectItem>
                  {locationsList.length === 0 ? (
                    <SelectItem value="NO_LOCATION" disabled>
                      No locations available
                    </SelectItem>
                  ) : (
                    locationsList.map((l) => (
                      <SelectItem key={String(l.id)} value={String(l.id)}>
                        {l.name} {l.code ? `(${l.code})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!locationExists && formData.location_id && formData.location_id !== UNSPECIFIED && (
                <div className="text-xs text-muted-foreground">Selected location is not in the current list</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input id="reference_number" value={formData.reference_number ?? ""} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} placeholder="PO#, Invoice#, etc." />
          </div>

          {movement?.movement_type === "IN" ? (
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={(formData.supplier_id ?? UNSPECIFIED) as string} onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSPECIFIED}>Unspecified</SelectItem>
                  {suppliersList.length === 0 ? (
                    <SelectItem value="NO_SUPPLIER" disabled>
                      No suppliers available
                    </SelectItem>
                  ) : (
                    suppliersList.map((s) => (
                      <SelectItem key={String(s.id)} value={String(s.id)}>
                        {s.name} {s.code ? `(${s.code})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!supplierExists && formData.supplier_id && formData.supplier_id !== UNSPECIFIED && (
                <div className="text-xs text-muted-foreground">Selected supplier is not in the current list</div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="customer">Customer/Department</Label>
              <Input id="customer" value={formData.customer ?? ""} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} placeholder="Customer or department name" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes ?? ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes about this movement" rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Movement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditMovementDialog
