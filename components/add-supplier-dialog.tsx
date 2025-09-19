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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SupplierData {
  name: string
  code: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  postal_code?: string
  tax_id?: string
  payment_terms?: string
  credit_limit?: number
  notes?: string
}

interface AddSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SupplierData) => void
}

export function AddSupplierDialog({ open, onOpenChange, onSubmit }: AddSupplierDialogProps) {
  const [formData, setFormData] = useState<SupplierData>({
    name: "",
    code: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postal_code: "",
    tax_id: "",
    payment_terms: "",
    credit_limit: 0,
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        name: "",
        code: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        postal_code: "",
        tax_id: "",
        payment_terms: "",
        credit_limit: 0,
        notes: "",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateCode = () => {
    const name = formData.name.trim()
    if (name) {
      const code = name
        .split(" ")
        .map((word) => word.substring(0, 3))
        .join("")
        .toUpperCase()
        .substring(0, 6)
      setFormData({ ...formData, code: code + "001" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="contact">Contact Details</TabsTrigger>
              <TabsTrigger value="business">Business Details</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Supplier Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Supplier Code *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          required
                        />
                        <Button type="button" variant="outline" onClick={generateCode}>
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tax_id">Tax ID</Label>
                      <Input
                        id="tax_id"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credit_limit">Credit Limit ($)</Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.credit_limit}
                        onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select
                      value={formData.payment_terms}
                      onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="net_30">Net 30 days</SelectItem>
                        <SelectItem value="net_60">Net 60 days</SelectItem>
                        <SelectItem value="net_90">Net 90 days</SelectItem>
                        <SelectItem value="cod">Cash on Delivery</SelectItem>
                        <SelectItem value="prepaid">Prepaid</SelectItem>
                        <SelectItem value="custom">Custom Terms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      placeholder="Additional notes about this supplier..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
