"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Plus, AlertCircle, Package } from "lucide-react"

interface ItemNotFoundProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  barcode: string
  onCreateItem?: (barcode: string) => void
  onSearchAgain?: () => void
}

export function ItemNotFound({ open, onOpenChange, barcode, onCreateItem, onSearchAgain }: ItemNotFoundProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleCreateItem = () => {
    if (onCreateItem) {
      onCreateItem(barcode)
      onOpenChange(false)
    }
  }

  const handleSearchAgain = () => {
    if (onSearchAgain) {
      onSearchAgain()
      onOpenChange(false)
    }
  }

  const handleManualSearch = () => {
    // In a real implementation, this would search the inventory
    console.log("Searching for:", searchTerm)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Item Not Found
          </DialogTitle>
          <DialogDescription>The scanned barcode was not found in the inventory</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scanned Barcode */}
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              <strong>Scanned Barcode:</strong> {barcode}
            </AlertDescription>
          </Alert>

          {/* Manual Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Manual Search
              </CardTitle>
              <CardDescription>Try searching for the item by name or description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-term">Search Term</Label>
                <div className="flex gap-2">
                  <Input
                    id="search-term"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter item name or description..."
                    className="flex-1"
                  />
                  <Button onClick={handleManualSearch} disabled={!searchTerm.trim()}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What would you like to do?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onCreateItem && (
                <Button onClick={handleCreateItem} className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Item with this Barcode
                </Button>
              )}

              {onSearchAgain && (
                <Button onClick={handleSearchAgain} variant="outline" className="w-full justify-start bg-transparent">
                  <Search className="mr-2 h-4 w-4" />
                  Scan Another Barcode
                </Button>
              )}

              <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full justify-start">
                <AlertCircle className="mr-2 h-4 w-4" />
                Cancel and Close
              </Button>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Check if the barcode is damaged or unclear</p>
                <p>• Verify the barcode format is supported</p>
                <p>• Try scanning from a different angle</p>
                <p>• Use manual entry if the barcode is unreadable</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
