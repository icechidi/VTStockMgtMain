"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Database, Settings, Bell, Shield, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"

interface DatabaseStatus {
  connected: boolean
  lastChecked: string
  version?: string
  error?: string
}

export default function SettingsPage() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    connected: false,
    lastChecked: new Date().toISOString(),
  })
  const [checking, setChecking] = useState(false)
  const [hydrated, setHydrated] = useState(false) // 🔑 prevents hydration mismatch
  const { toast } = useToast()

  useEffect(() => {
    setHydrated(true) // ✅ ensures date formatting runs only on client
    checkDatabaseConnection()
  }, [])

  const checkDatabaseConnection = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/health/database")
      const data = await response.json()

      setDbStatus({
        connected: data.connected,
        lastChecked: new Date().toISOString(),
        version: data.version,
        error: data.error,
      })
    } catch (error) {
      setDbStatus({
        connected: false,
        lastChecked: new Date().toISOString(),
        error: "Failed to check database connection",
      })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure your inventory system preferences</p>
      </div>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database Connection</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={checkDatabaseConnection} disabled={checking}>
              {checking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {checking ? "Checking..." : "Refresh"}
            </Button>
          </div>
          <CardDescription>Monitor your database connection status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {dbStatus.connected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">{dbStatus.connected ? "Connected" : "Disconnected"}</span>
            </div>
            <Badge variant={dbStatus.connected ? "default" : "destructive"}>
              {dbStatus.connected ? "Online" : "Offline"}
            </Badge>
          </div>

          {/* ✅ Fix hydration issue by rendering date only after hydration */}
          {hydrated && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last checked: {new Date(dbStatus.lastChecked).toLocaleString()}</span>
            </div>
          )}

          {dbStatus.version && (
            <div className="text-sm text-muted-foreground">
              <strong>Database Version:</strong> {dbStatus.version}
            </div>
          )}

          {dbStatus.error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              <strong>Error:</strong> {dbStatus.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Host:</strong> {process.env.NEXT_PUBLIC_DB_HOST || "localhost"}
            </div>
            <div>
              <strong>Database:</strong> {process.env.NEXT_PUBLIC_DB_NAME || "VTStockDB"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <CardTitle>System Settings</CardTitle>
          </div>
          <CardDescription>Configure general system preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-backup">Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">Enable daily automatic database backups</p>
            </div>
            <Switch id="auto-backup" defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="low-stock-alerts">Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">Send notifications when items are running low</p>
            </div>
            <Switch id="low-stock-alerts" defaultChecked />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input id="company-name" placeholder="Your Company Name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email</Label>
            <Input id="admin-email" type="email" placeholder="admin@company.com" />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="movement-alerts">Movement Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified of all stock movements</p>
            </div>
            <Switch id="movement-alerts" />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Receive weekly inventory summary reports</p>
            </div>
            <Switch id="weekly-reports" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Configure security and access settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="two-factor">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Switch id="two-factor" />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="session-timeout">Auto Session Timeout</Label>
              <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
            </div>
            <Switch id="session-timeout" defaultChecked />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="session-duration">Session Duration (minutes)</Label>
            <Input id="session-duration" type="number" defaultValue="60" min="15" max="480" />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={() => toast({ title: "Settings saved successfully" })}>Save Changes</Button>
      </div>
    </div>
  )
}
