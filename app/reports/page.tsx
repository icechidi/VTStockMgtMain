"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  CalendarIcon,
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  BarChart3,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ReportData {
  totalItems: number
  totalValue: number
  lowStockItems: number
  totalMovements: number
  stockInValue: number
  stockOutValue: number
  topItems: Array<{
    name: string
    quantity: number
    value: number
  }>
  lowStockList: Array<{
    name: string
    quantity: number
    min_quantity: number
    location: string
  }>
  recentMovements: Array<{
    item_name: string
    movement_type: string
    quantity: number
    movement_date: string
  }>
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [reportType, setReportType] = useState("inventory")
  const [location, setLocation] = useState("ALL")

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    setDateFrom(thirtyDaysAgo)
    setDateTo(today)
  }, [])

  const generateReport = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual API endpoints
      const [itemsRes, movementsRes, lowStockRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/movements"),
        fetch("/api/items/low-stock"),
      ])

      const [items, movements, lowStock] = await Promise.all([itemsRes.json(), movementsRes.json(), lowStockRes.json()])

      // Filter movements by date range
      const filteredMovements = movements.filter((m: any) => {
        const movementDate = new Date(m.movement_date)
        return (!dateFrom || movementDate >= dateFrom) && (!dateTo || movementDate <= dateTo)
      })

      // Calculate report data
      const totalValue = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)
      const stockInMovements = filteredMovements.filter((m: any) => m.movement_type === "IN")
      const stockOutMovements = filteredMovements.filter((m: any) => m.movement_type === "OUT")

      const stockInValue = stockInMovements.reduce((sum: number, m: any) => sum + (Number(m.total_value) || 0), 0)
      const stockOutValue = stockOutMovements.reduce((sum: number, m: any) => sum + (Number(m.total_value) || 0), 0)

      // Top items by value
      const topItems = items
        .map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          value: item.quantity * item.unit_price,
        }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 10)

      const reportData: ReportData = {
        totalItems: items.length,
        totalValue,
        lowStockItems: lowStock.length,
        totalMovements: filteredMovements.length,
        stockInValue,
        stockOutValue,
        topItems,
        lowStockList: lowStock.slice(0, 10),
        recentMovements: filteredMovements.slice(0, 10),
      }

      setReportData(reportData)
      toast({
        title: "Success",
        description: "Report generated successfully",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (exportFormat: "csv" | "pdf") => {
    if (!reportData) return

    if (exportFormat === "csv") {
      const csvContent = [
        ["Report Type", reportType],
        ["Generated Date", new Date().toISOString()],
        [
          "Date Range",
          `${dateFrom ? format(dateFrom, "yyyy-MM-dd") : "N/A"} to ${dateTo ? format(dateTo, "yyyy-MM-dd") : "N/A"}`,
        ],
        [""],
        ["SUMMARY"],
        ["Total Items", reportData.totalItems.toString()],
        ["Total Value", `$${Number(reportData.totalValue || 0).toFixed(2)}`],
        ["Low Stock Items", reportData.lowStockItems.toString()],
        ["Total Movements", reportData.totalMovements.toString()],
        ["Stock In Value", `$${Number(reportData.stockInValue || 0).toFixed(2)}`],
        ["Stock Out Value", `$${Number(reportData.stockOutValue || 0).toFixed(2)}`],
        [""],
        ["TOP ITEMS BY VALUE"],
        ["Item Name", "Quantity", "Value"],
        ...reportData.topItems.map((item) => [
          item.name,
          item.quantity.toString(),
          `$${Number(item.value || 0).toFixed(2)}`,
        ]),
        [""],
        ["LOW STOCK ITEMS"],
        ["Item Name", "Current Stock", "Min Stock", "Location"],
        ...reportData.lowStockList.map((item) => [
          item.name,
          item.quantity.toString(),
          item.min_quantity.toString(),
          item.location,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `inventory-report-${format(new Date(), "yyyy-MM-dd")}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "CSV report exported successfully",
      })
    } else if (exportFormat === "pdf") {
      generatePDFReport()
    }
  }

  const generatePDFReport = () => {
    if (!reportData) return

    // Create a new window for the PDF content
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow popups to generate PDF reports",
        variant: "destructive",
      })
      return
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Inventory Report - ${format(new Date(), "yyyy-MM-dd")}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
        .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .summary-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #333; }
        .low-stock { color: #dc2626; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Inventory Report</h1>
        <p><strong>Report Type:</strong> ${reportType}</p>
        <p><strong>Generated:</strong> ${format(new Date(), "PPP 'at' p")}</p>
        <p><strong>Date Range:</strong> ${dateFrom ? format(dateFrom, "PPP") : "N/A"} to ${dateTo ? format(dateTo, "PPP") : "N/A"}</p>
        ${location !== "ALL" ? `<p><strong>Location:</strong> ${location}</p>` : ""}
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total Items</h3>
          <div class="value">${reportData.totalItems}</div>
        </div>
        <div class="summary-card">
          <h3>Total Value</h3>
          <div class="value">$${Number(reportData.totalValue || 0).toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <h3>Low Stock Items</h3>
          <div class="value low-stock">${reportData.lowStockItems}</div>
        </div>
        <div class="summary-card">
          <h3>Total Movements</h3>
          <div class="value">${reportData.totalMovements}</div>
        </div>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Stock In Value</h3>
          <div class="value" style="color: #16a34a;">$${Number(reportData.stockInValue || 0).toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <h3>Stock Out Value</h3>
          <div class="value" style="color: #dc2626;">$${Number(reportData.stockOutValue || 0).toFixed(2)}</div>
        </div>
      </div>

      <div class="section-title">Top Items by Value</div>
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Total Value</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.topItems
            .map(
              (item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>$${Number(item.value || 0).toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      ${
        reportData.lowStockList.length > 0
          ? `
        <div class="section-title">Low Stock Items</div>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Current Stock</th>
              <th>Minimum Stock</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.lowStockList
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td class="low-stock">${item.quantity}</td>
                <td>${item.min_quantity}</td>
                <td>${item.location}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
          : ""
      }

      ${
        reportData.recentMovements.length > 0
          ? `
        <div class="section-title">Recent Movements</div>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.recentMovements
              .map(
                (movement) => `
              <tr>
                <td>${movement.item_name}</td>
                <td style="color: ${movement.movement_type === "IN" ? "#16a34a" : "#dc2626"};">${movement.movement_type}</td>
                <td>${movement.quantity}</td>
                <td>${format(new Date(movement.movement_date), "MMM dd, yyyy HH:mm")}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
          : ""
      }

      <div class="footer">
        <p>Generated by Stock Management System on ${format(new Date(), "PPP 'at' p")}</p>
        <button class="no-print" onclick="window.print()" style="margin: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
        <button class="no-print" onclick="window.close()" style="margin: 20px; padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
      </div>
    </body>
    </html>
  `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Auto-focus the print window
    printWindow.focus()

    toast({
      title: "Success",
      description: "PDF report opened in new window. Use browser's print function to save as PDF.",
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        </div>
        {reportData && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => exportReport("csv")}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => exportReport("pdf")}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inventory">Inventory Summary</SelectItem>
                      <SelectItem value="movements">Stock Movements</SelectItem>
                      <SelectItem value="low-stock">Low Stock Alert</SelectItem>
                      <SelectItem value="valuation">Inventory Valuation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Locations</SelectItem>
                      <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                      <SelectItem value="Store A">Store A</SelectItem>
                      <SelectItem value="Store B">Store B</SelectItem>
                      <SelectItem value="Distribution Center">Distribution Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={generateReport} disabled={loading}>
                  {loading ? (
                    "Generating..."
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Results */}
          {reportData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalItems}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${reportData.totalValue.toFixed(2)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.lowStockItems}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.totalMovements}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Tables */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Items by Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reportData.topItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                          </div>
                          <div className="font-bold">${item.value.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Low Stock Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reportData.lowStockList.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.location}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">{item.quantity}</div>
                            <div className="text-xs text-muted-foreground">Min: {item.min_quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Scheduled reporting functionality will be implemented in a future update. This will allow you to
                automatically generate and email reports on a regular basis.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
