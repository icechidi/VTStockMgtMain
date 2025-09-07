"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Scan, X, Search } from "lucide-react"

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
}

interface BarcodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemFound: (item: ScannedItem) => void
  onItemNotFound: (barcode: string) => void
  inventory: ScannedItem[]
}

export function BarcodeScanner({ open, onOpenChange, onItemFound, onItemNotFound, inventory }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    checkCameraAvailability()
    return () => {
      stopCamera()
    }
  }, [])

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")
      setHasCamera(videoDevices.length > 0)
    } catch (err) {
      setHasCamera(false)
    }
  }

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions or use manual entry.")
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const handleManualScan = () => {
    if (manualBarcode.trim()) {
      searchByBarcode(manualBarcode.trim())
      setManualBarcode("")
    }
  }

  const searchByBarcode = (barcode: string) => {
    const item = inventory.find((item) => item.barcode === barcode)
    if (item) {
      onItemFound(item)
      onOpenChange(false)
      stopCamera()
    } else {
      onItemNotFound(barcode)
    }
  }

  // Simulate barcode detection (in real implementation, you'd use a barcode scanning library)
  const simulateBarcodeScan = (barcode: string) => {
    searchByBarcode(barcode)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualScan()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Barcode Scanner
          </DialogTitle>
          <DialogDescription>Scan a barcode or QR code to quickly find inventory items</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Camera Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasCamera ? (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg object-cover"
                      style={{ display: isScanning ? "block" : "none" }}
                    />
                    {!isScanning && (
                      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500">Camera preview will appear here</p>
                        </div>
                      </div>
                    )}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-blue-500 rounded-lg bg-transparent">
                          <div className="w-full h-full border border-blue-300 rounded-lg animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!isScanning ? (
                      <Button onClick={startCamera} className="flex-1">
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent">
                        <X className="mr-2 h-4 w-4" />
                        Stop Camera
                      </Button>
                    )}
                  </div>

                  {/* Demo buttons for testing */}
                  {isScanning && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Demo: Click to simulate scanning</p>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => simulateBarcodeScan("BC001")}>
                          Scan Monitor
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => simulateBarcodeScan("BC002")}>
                          Scan Mouse
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => simulateBarcodeScan("BC999")}>
                          Scan Unknown
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Camera not available</p>
                  <p className="text-sm text-gray-400">Please use manual entry below</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Manual Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-barcode">Enter Barcode/QR Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-barcode"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type or paste barcode here..."
                    className="flex-1"
                  />
                  <Button onClick={handleManualScan} disabled={!manualBarcode.trim()}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>You can also:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Type the barcode manually</li>
                  <li>Paste from clipboard</li>
                  <li>Use a USB barcode scanner</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
