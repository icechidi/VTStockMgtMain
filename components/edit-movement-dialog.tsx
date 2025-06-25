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
  id: number
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
  created_at: string
}

interface EditMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movement: StockMovement
  onSubmit: (data: Partial<StockMovement>) => void
}

export function EditMovementDialog({ open, onOpenChange, movement, onSubmit }: EditMovementDialogProps) {
  const [formData, setFormData] = useState<Partial<StockMovement>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (movement) {
      setFormData({
        quantity: movement.quantity,
        unit_price: movement.unit_price,
        notes: movement.notes,
        location: movement.location,
        reference_number: movement.reference_number,
        supplier: movement.supplier,
        customer: movement.customer,
        movement_date: movement.movement_date.slice(0, 16), // Format for datetime-local input
      })
    }
  }, [movement])

  useEffect(() => {
    if (formData.quantity && formData.unit_price) {
      setFormData((prev) => ({
        ...prev,
        total_value: formData.quantity! * formData.unit_price!,
      }))
    }
  }, [formData.quantity, formData.unit_price])

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.push("Quantity must be greater than 0")
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      setErrors([])
    } finally {
      setIsSubmitting(false)
    }
  }

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
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
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
                value={formData.quantity || ""}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price ($)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price || ""}
                onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
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
              <Label htmlFor="movement_date">Date & Time</Label>
              <Input
                id="movement_date"
                type="datetime-local"
                value={formData.movement_date || ""}
                onChange={(e) => setFormData({ ...formData, movement_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location || ""}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                  <SelectItem value="Store A">Store A</SelectItem>
                  <SelectItem value="Store B">Store B</SelectItem>
                  <SelectItem value="Distribution Center">Distribution Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number || ""}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="PO#, Invoice#, etc."
            />
          </div>

          {movement.movement_type === "IN" ? (
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier || ""}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Supplier name"
              />
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
