"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, MapPin, Tag, Calendar, QrCode, Edit, ArrowUpDown } from "lucide-react"

interface ScannedItem {
  id: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  location: string
  category: string
  subcategory: string
  barcode: string
  status: "in_stock" | "low_stock" | "out_of_stock"
  last_updated?: string
}

interface ItemLookupResultProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ScannedItem | null
  onEditItem?: (item: ScannedItem) => void
  onRecordMovement?: (item: ScannedItem) => void
  onGenerateBarcode?: (item: ScannedItem) => void
}

export function ItemLookupResult({
  open,
  onOpenChange,
  item,
  onEditItem,
  onRecordMovement,
  onGenerateBarcode,
}: ItemLookupResultProps) {
  if (!open || !item) return null

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "in_stock":
        return "default"
      case "low_stock":
        return "secondary"
      case "out_of_stock":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return "text-green-600"
      case "low_stock":
        return "text-yellow-600"
      case "out_of_stock":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />

      {/* centered panel (matches Edit modal positioning) */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-md shadow-lg overflow-hidden">
          {/* header */}
          <div className="p-4 border-b dark:border-slate-800 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-base font-semibold">
                <Package className="h-4 w-4" />
                <span>Item Found</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Scanned item details and available actions</div>
            </div>

            <div className="text-xs text-muted-foreground">{item.last_updated ? formatDate(item.last_updated) : ""}</div>
          </div>

          {/* body - scrollable and compact */}
          <div className="p-4 max-h-[80vh] overflow-y-auto space-y-3">
            {/* Item Overview */}
            <Card>
              <CardHeader className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">{item.name}</CardTitle>
                    {item.description && <CardDescription className="text-xs line-clamp-2">{item.description}</CardDescription>}
                  </div>
                  <Badge variant={getStatusBadgeVariant(item.status)} className="capitalize text-xs px-2 py-1">
                    {item.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <div className={`text-lg font-semibold ${getStatusColor(item.status)}`}>{item.quantity}</div>
                    <div className="text-xs text-muted-foreground">In Stock</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">${item.unit_price}</div>
                    <div className="text-xs text-muted-foreground">Unit Price</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">
                      ${(item.quantity * item.unit_price).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Value</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-purple-600">{item.barcode}</div>
                    <div className="text-xs text-muted-foreground">Barcode</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <div className="grid gap-2 md:grid-cols-2">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-sm px-2 py-1">
                      {item.location}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Current storage location</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <Badge variant="default" className="text-sm px-2 py-1">{item.category}</Badge>
                      <Badge variant="secondary" className="text-sm px-2 py-1">{item.subcategory}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Item classification</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Info */}
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div>
                    <Label className="text-xs font-medium">Item ID</Label>
                    <div className="text-xs text-muted-foreground">{item.id}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Last Updated</Label>
                    <div className="text-xs text-muted-foreground">{formatDate(item.last_updated)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {onEditItem && (
                    <Button onClick={() => onEditItem(item)} variant="outline" className="flex flex-col h-auto p-2 text-xs">
                      <Edit className="h-4 w-4 mb-1" />
                      <span className="text-xs">Edit</span>
                    </Button>
                  )}
                  {onRecordMovement && (
                    <Button onClick={() => onRecordMovement(item)} variant="outline" className="flex flex-col h-auto p-2 text-xs">
                      <ArrowUpDown className="h-4 w-4 mb-1" />
                      <span className="text-xs">Movement</span>
                    </Button>
                  )}
                  {onGenerateBarcode && (
                    <Button onClick={() => onGenerateBarcode(item)} variant="outline" className="flex flex-col h-auto p-2 text-xs">
                      <QrCode className="h-4 w-4 mb-1" />
                      <span className="text-xs">Generate</span>
                    </Button>
                  )}
                  <Button onClick={() => navigator.clipboard.writeText(item.barcode)} variant="outline" className="flex flex-col h-auto p-2 text-xs">
                    <Package className="h-4 w-4 mb-1" />
                    <span className="text-xs">Copy</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Footer actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
