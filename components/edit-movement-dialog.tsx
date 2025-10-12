// components/edit-movement-dialog.tsx
"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
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
  locations?: Location[] | null
  suppliers?: Supplier[] | null
  onSubmit: (data: { id: number | string; payload: Partial<StockMovement> }) => Promise<void> | void
}

const UNSPECIFIED = "UNSPECIFIED" // sentinel used for the Selects

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v)
}

/**
 * EditMovementDialog
 * - Safe mapping of movement.location / movement.supplier to ids using lists
 * - If a current supplier/location isn't present in the lists, it is shown as a temporary SelectItem
 * - When submitting, we only send IDs that exist in the provided lists (prevents invalid UUIDs)
 */
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

  // format ISO -> datetime-local (YYYY-MM-DDTHH:mm)
  const toInputDateTime = (iso?: string) => {
    if (!iso) {
      const now = new Date()
      const tz = now.getTimezoneOffset()
      const local = new Date(now.getTime() - tz * 60_000)
      return local.toISOString().slice(0, 16)
    }
    const d = new Date(iso)
    if (isNaN(d.getTime())) {
      const now = new Date()
      const tz = now.getTimezoneOffset()
      const local = new Date(now.getTime() - tz * 60_000)
      return local.toISOString().slice(0, 16)
    }
    const tz = d.getTimezoneOffset()
    const local = new Date(d.getTime() - tz * 60_000)
    return local.toISOString().slice(0, 16)
  }

  // Helper to try finding an id in list by id/name/code
  const findIdInList = <T extends { id: string; name?: string; code?: string }>(list: T[] | undefined, value?: string | null) => {
    if (!list || !value) return undefined
    const v = String(value)
    return list.find((x) => x.id === v || x.name === v || (x.code && x.code === v))?.id
  }

  // initialize formData when movement arrives (or when lists change)
  useEffect(() => {
    if (!movement) {
      setFormData({})
      return
    }

    // derive supplier id (try supplier_id, then supplier name/code)
    const matchedSupplierId = movement.supplier_id ? String(movement.supplier_id) : findIdInList(suppliers ?? undefined, movement.supplier)

    // derive location id (try location_id, then location name/code)
    const matchedLocationId = (movement as any).location_id ? String((movement as any).location_id) : findIdInList(locations ?? undefined, movement.location)

    // numeric safety
    const q = Number(movement.quantity)
    const up = movement.unit_price === undefined || movement.unit_price === null ? undefined : Number(movement.unit_price)

    setFormData({
      quantity: Number.isFinite(q) ? q : 0,
      unit_price: Number.isFinite(Number(up)) ? Number(up) : undefined,
      total_value:
        Number.isFinite(q) && Number.isFinite(Number(up))
          ? q * Number(up)
          : movement.total_value ?? undefined,
      notes: movement.notes ?? undefined,
      // If we could match an id, use it. If not, but movement provides a string, keep that string as "current" value so we can show it
      location_id: matchedLocationId ?? (movement.location ? String(movement.location) : UNSPECIFIED),
      supplier_id: matchedSupplierId ?? (movement.supplier ? String(movement.supplier) : UNSPECIFIED),
      reference_number: movement.reference_number ?? undefined,
      customer: movement.customer ?? undefined,
      movement_date: toInputDateTime(movement.movement_date),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movement, (locations ?? []).length, (suppliers ?? []).length])

  // recompute total_value when quantity or unit_price change
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

      // unit_price (optional)
      if (
        formData.unit_price !== undefined &&
        formData.unit_price !== null &&
        String(formData.unit_price) !== ""
      ) {
        const up = typeof formData.unit_price === "number" ? formData.unit_price : Number(formData.unit_price as any)
        payload.unit_price = Number.isFinite(up) ? up : undefined
      } else {
        payload.unit_price = undefined
      }

      // total_value computed if possible
      if (payload.quantity !== undefined && payload.unit_price !== undefined && Number.isFinite(payload.quantity) && Number.isFinite(payload.unit_price)) {
        payload.total_value = payload.quantity * payload.unit_price
      } else if (formData.total_value !== undefined && isFiniteNumber(formData.total_value as any)) {
        payload.total_value = formData.total_value as number
      } else {
        payload.total_value = undefined
      }

      // string fields: reference_number, notes, customer, movement_date
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

      // supplier_id & location_id: ensure they correspond to known IDs from lists before sending
      const locationCandidate = formData.location_id ? String(formData.location_id) : undefined
      const supplierCandidate = formData.supplier_id ? String(formData.supplier_id) : undefined

      const matchedLocation = locations?.find((l) => l.id === locationCandidate)
      const matchedSupplier = suppliers?.find((s) => s.id === supplierCandidate)

      // Only set id fields when we matched them to list items (prevents sending raw names or unknown strings as UUIDs)
      payload.location_id = matchedLocation ? matchedLocation.id : undefined
      payload.supplier_id = matchedSupplier ? matchedSupplier.id : undefined

      // call parent handler
      await onSubmit({ id: movement.id, payload })
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

  // Determine if the current formData location_id/supplier_id exists in the provided lists.
  const currentLocationId = formData.location_id && formData.location_id !== UNSPECIFIED ? String(formData.location_id) : null
  const currentSupplierId = formData.supplier_id && formData.supplier_id !== UNSPECIFIED ? String(formData.supplier_id) : null
  const locationExists = locations?.some((l) => l.id === currentLocationId)
  const supplierExists = suppliers?.some((s) => s.id === currentSupplierId)

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
              <Select
                value={(formData.location_id ?? UNSPECIFIED) as string}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, location_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSPECIFIED}>Unspecified</SelectItem>

                  {/* If the current location id isn't present in the list but we have a movement.location string,
                      display it as a temporary option so the user sees the current value. */}
                  {!locationExists && currentLocationId && movement?.location && (
                    <SelectItem value={currentLocationId}>
                      {movement.location}
                    </SelectItem>
                  )}

                  {(locations ?? []).length === 0 ? (
                    <SelectItem value="NO_LOCATION" disabled>
                      No locations available
                    </SelectItem>
                  ) : (
                    (locations ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} {l.code ? `(${l.code})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number ?? ""}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="PO#, Invoice#, etc."
            />
          </div>

          {movement?.movement_type === "IN" ? (
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={(formData.supplier_id ?? UNSPECIFIED) as string}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSPECIFIED}>Unspecified</SelectItem>

                  {/* Show current supplier string as a temporary option if not in list */}
                  {!supplierExists && currentSupplierId && movement?.supplier && (
                    <SelectItem value={currentSupplierId}>{movement.supplier}</SelectItem>
                  )}

                  {(suppliers ?? []).length === 0 ? (
                    <SelectItem value="NO_SUPPLIER" disabled>
                      No suppliers available
                    </SelectItem>
                  ) : (
                    (suppliers ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="customer">Customer/Department</Label>
              <Input
                id="customer"
                value={formData.customer ?? ""}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                placeholder="Customer or department name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes ?? ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this movement"
              rows={3}
            />
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
