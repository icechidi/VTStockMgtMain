"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Package,
  Calendar,
  MapPin,
  User,
  FileText,
  DollarSign,
  Hash,
  Building,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { format } from "date-fns"

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

interface MovementDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movement: StockMovement
}

export function MovementDetailsDialog({ open, onOpenChange, movement }: MovementDetailsDialogProps) {
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "PPP 'at' p")
  }

  const getMovementIcon = (type: "IN" | "OUT") => {
    return type === "IN" ? (
      <TrendingUp className="h-5 w-5 text-green-600" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-600" />
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getMovementIcon(movement.movement_type)}
            Movement Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{movement.item_name}</h3>
                  <p className="text-muted-foreground">Movement ID: #{movement.id}</p>
                </div>
                <Badge
                  variant={movement.movement_type === "IN" ? "default" : "destructive"}
                  className="text-sm px-3 py-1"
                >
                  {movement.movement_type === "IN" ? "Stock In" : "Stock Out"}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-semibold text-lg">{movement.quantity} units</p>
                  </div>
                </div>

                {movement.total_value && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="font-semibold text-lg">${movement.total_value.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Movement Information */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">Movement Information</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Movement Date</p>
                      <p className="font-medium">{formatDateTime(movement.movement_date)}</p>
                    </div>
                  </div>

                  {movement.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{movement.location}</p>
                      </div>
                    </div>
                  )}

                  {movement.user_name && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Recorded By</p>
                        <p className="font-medium">{movement.user_name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDateTime(movement.created_at)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">Transaction Details</h4>
                <div className="space-y-4">
                  {movement.unit_price && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Unit Price</p>
                        <p className="font-medium">${movement.unit_price.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {movement.reference_number && (
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Reference Number</p>
                        <p className="font-medium">{movement.reference_number}</p>
                      </div>
                    </div>
                  )}

                  {movement.supplier && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Supplier</p>
                        <p className="font-medium">{movement.supplier}</p>
                      </div>
                    </div>
                  )}

                  {movement.customer && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Customer/Department</p>
                        <p className="font-medium">{movement.customer}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {movement.notes && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-muted-foreground leading-relaxed">{movement.notes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="border-2 border-dashed">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">Movement Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-medium">{movement.item_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant={movement.movement_type === "IN" ? "default" : "destructive"}>
                    {movement.movement_type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{movement.quantity} units</span>
                </div>
                {movement.unit_price && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium">${movement.unit_price.toFixed(2)}</span>
                  </div>
                )}
                {movement.total_value && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total Value:</span>
                      <span className="text-lg">${movement.total_value.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
