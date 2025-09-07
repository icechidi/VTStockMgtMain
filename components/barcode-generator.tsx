"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QrCode, Download, Copy, Printer } from "lucide-react"

interface BarcodeGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId?: string
  itemName?: string
  defaultBarcode?: string
}

export function BarcodeGenerator({ open, onOpenChange, itemId, itemName, defaultBarcode }: BarcodeGeneratorProps) {
  const [barcode, setBarcode] = useState(defaultBarcode || `BC${itemId?.padStart(3, "0") || "001"}`)
  const [qrData, setQrData] = useState(`{"id":"${itemId}","name":"${itemName}","barcode":"${barcode}"}`)

  const generateBarcode = () => {
    const newBarcode = `BC${Date.now().toString().slice(-6)}`
    setBarcode(newBarcode)
    setQrData(`{"id":"${itemId}","name":"${itemName}","barcode":"${newBarcode}"}`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadBarcode = () => {
    const element = document.createElement("a")
    const file = new Blob([`Barcode: ${barcode}\nItem: ${itemName}\nID: ${itemId}`], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `barcode-${itemId}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const printBarcode = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode - ${itemName}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .barcode { font-family: 'Courier New', monospace; font-size: 24px; letter-spacing: 2px; margin: 20px 0; }
              .item-info { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h2>${itemName}</h2>
            <div class="barcode">||||| ${barcode} |||||</div>
            <div class="item-info">Item ID: ${itemId}</div>
            <div class="item-info">Barcode: ${barcode}</div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 rounded-lg p-6 overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Barcode Generator
          </DialogTitle>
          <DialogDescription>Generate and manage barcodes for inventory items</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Item Name</Label>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{itemName || "Unknown Item"}</div>
                </div>
                <div>
                  <Label>Item ID</Label>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{itemId || "N/A"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Barcode Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barcode-input">Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode-input"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={generateBarcode} variant="outline">
                    Generate New
                  </Button>
                </div>
              </div>

              {/* Barcode Preview */}
              <div className="border rounded-lg p-6 text-center bg-slate-50 dark:bg-slate-800">
                <div className="space-y-4">
                  <div className="text-2xl font-mono tracking-widest text-slate-900 dark:text-slate-100">||||| {barcode} |||||</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{itemName}</div>
                  <Badge variant="outline">Code 128 Format</Badge>
                </div>
              </div>

              {/* QR Code Preview */}
              <div className="border rounded-lg p-6 text-center bg-slate-50 dark:bg-slate-800">
                <div className="space-y-4">
                  <div className="w-32 h-32 mx-auto bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-gray-500 dark:text-gray-300" />
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">QR Code with item data</div>
                  <Badge variant="outline">QR Code Format</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button onClick={() => copyToClipboard(barcode)} variant="outline" className="flex flex-col h-auto p-4">
                  <Copy className="h-5 w-5 mb-2" />
                  <span className="text-xs">Copy Barcode</span>
                </Button>
                <Button onClick={() => copyToClipboard(qrData)} variant="outline" className="flex flex-col h-auto p-4">
                  <QrCode className="h-5 w-5 mb-2" />
                  <span className="text-xs">Copy QR Data</span>
                </Button>
                <Button onClick={downloadBarcode} variant="outline" className="flex flex-col h-auto p-4 bg-transparent">
                  <Download className="h-5 w-5 mb-2" />
                  <span className="text-xs">Download</span>
                </Button>
                <Button onClick={printBarcode} variant="outline" className="flex flex-col h-auto p-4 bg-transparent">
                  <Printer className="h-5 w-5 mb-2" />
                  <span className="text-xs">Print</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <p>
                  <strong>Barcode:</strong> Use with standard barcode scanners
                </p>
                <p>
                  <strong>QR Code:</strong> Scan with mobile devices or QR scanners
                </p>
                <p>
                  <strong>Printing:</strong> Print labels and attach to physical items
                </p>
                <p>
                  <strong>Scanning:</strong> Use the scanner tool to quickly find items
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
