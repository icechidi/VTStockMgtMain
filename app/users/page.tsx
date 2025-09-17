"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UsersIcon,
  Plus,
  Edit,
  Trash2,
  Search,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Loader2,
  MapPin,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DatabaseUser {
  id: string
  name?: string | null
  email?: string | null
  role?: "admin" | "manager" | "employee" | "viewer"
  status?: "active" | "inactive"
  location_id?: string | null
  location_name?: string | null
  location_code?: string | null
  avatar?: string | null
  join_date?: string | null
  phone?: string | null
  department?: string | null
  last_login?: string | null
  created_at?: string | null
  updated_at?: string | null
}

interface Location {
  id: string
  name: string
  code: string
}

/** Helpers **/

function getInitials(user: { name?: string | null; email?: string | null }) {
  const src = (user.name ?? user.email ?? "U").trim()
  if (!src) return "U"
  const parts = src.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) {
    const single = parts[0]
    if (single.includes("@")) {
      const before = single.split("@")[0]
      return (before.slice(0, 2) || "U").toUpperCase()
    }
    return single.slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function UsersPageDatabase() {
  const [users, setUsers] = useState<DatabaseUser[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<DatabaseUser | null>(null)
  const [formData, setFormData] = useState<Partial<DatabaseUser>>({})
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // OTP modal state
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [createdUserOtp, setCreatedUserOtp] = useState<string | null>(null)
  const [createdUserInfo, setCreatedUserInfo] = useState<Partial<DatabaseUser> | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    fetchLocations()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : [])
      } else {
        throw new Error("Failed to fetch users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users from database",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations")
      if (response.ok) {
        const data = await response.json()
        setLocations(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  // Frontend filtering with safe fallbacks
  const filteredUsers = users.filter((user) => {
    const name = (user.name ?? "").toString()
    const email = (user.email ?? "").toString()
    const department = (user.department ?? "").toString()
    const search = searchTerm.toLowerCase().trim()

    const matchesSearch =
      name.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search) ||
      department.toLowerCase().includes(search)

    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesLocation = locationFilter === "all" || (user.location_id ?? "") === locationFilter

    return matchesSearch && matchesRole && matchesStatus && matchesLocation
  })

  const handleAddUser = () => {
    setEditingUser(null)
    setFormData({
      status: "active",
      role: "employee",
      join_date: new Date().toISOString().split("T")[0],
    })
    setIsDialogOpen(true)
  }

  const handleEditUser = (user: DatabaseUser) => {
    setEditingUser(user)
    setFormData({
      ...user,
      join_date: user.join_date ? user.join_date.split("T")[0] : "",
    })
    setIsDialogOpen(true)
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers((prev) => prev.filter((user) => user.id !== id))
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
      } else {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      // read response body exactly once
      const body = await response.json().catch(() => null)

      if (!response.ok) {
        // handle duplicate email (409) specifically
        if (response.status === 409) {
          toast({
            title: "Conflict",
            description: body?.error ?? "Email already exists",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: body?.error ?? "Failed to save user",
            variant: "destructive",
          })
        }
        return
      }

      // Success
      if (editingUser) {
        // Accept either raw updated row or { user: row }
        const updatedUser = (body && (body.user ?? body)) as DatabaseUser
        if (updatedUser) {
          setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updatedUser : u)))
        }
        toast({
          title: "Success",
          description: "User updated successfully",
        })
      } else {
        // POST returns { user: safeUser, oneTimePassword }
        const created = (body && (body.user ?? body)) as DatabaseUser
        const otp = body?.oneTimePassword ?? null

        if (created) {
          setUsers((prev) => [...prev, created])
        }

        if (otp) {
          setCreatedUserOtp(otp)
          setCreatedUserInfo(created ?? null)
          setOtpModalOpen(true)
          toast({
            title: "User Created",
            description: "One-time password created — shown once for secure sharing.",
          })
        } else {
          toast({
            title: "User Created",
            description: "User created successfully",
          })
        }
      }

      setIsDialogOpen(false)
      setFormData({})
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: "Failed to save user",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4" />
      case "manager":
        return <Shield className="h-4 w-4" />
      case "employee":
        return <UsersIcon className="h-4 w-4" />
      case "viewer":
        return <UsersIcon className="h-4 w-4" />
      default:
        return <UsersIcon className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      case "employee":
        return "secondary"
      case "viewer":
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* OTP modal - shown only once after create */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>One-Time Password</DialogTitle>
            <DialogDescription>
              This password is shown only once. Share it securely with the new user — they'll be required to change it at first login.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-2 text-sm text-muted-foreground">
              {createdUserInfo ? `User: ${createdUserInfo.name ?? createdUserInfo.email ?? "—"}` : null}
            </div>

            <div className="flex items-center justify-between rounded border p-3">
              <div className="font-mono text-lg">{createdUserOtp}</div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (createdUserOtp) navigator.clipboard.writeText(createdUserOtp)
                    toast({ title: "Copied", description: "OTP copied to clipboard" })
                  }}
                >
                  Copy
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setOtpModalOpen(false)
                    setCreatedUserOtp(null)
                    setCreatedUserInfo(null)
                  }}
                >
                  Done
                </Button>
              </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              The user will be required to set a new password when they sign in using this one-time password.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage your team members and their permissions</p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  +
                  {users.filter((u) => u.created_at && new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}{" "}
                  this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</div>
                <p className="text-xs text-muted-foreground">
                  {users.length > 0 ? Math.round((users.filter((u) => u.status === "active").length / users.length) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Crown className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</div>
                <p className="text-xs text-muted-foreground">System administrators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.filter((u) => u.status === "inactive").length}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </div>

          {/* ... recent users & role distribution (kept safe) ... */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest team members added</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users
                    .slice()
                    .sort((a, b) => (new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()))
                    .slice(0, 5)
                    .map((user) => {
                      const name = user.name ?? user.email ?? "—"
                      const email = user.email ?? "—"
                      return (
                        <div key={user.id} className="flex items-center space-x-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{getInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{name}</p>
                            <p className="text-sm text-muted-foreground">{email}</p>
                          </div>
                          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role ?? "employee"}</Badge>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>Users by role type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["admin", "manager", "employee", "viewer"].map((role) => {
                    const count = users.filter((u) => u.role === role).length
                    const percentage = users.length > 0 ? (count / users.length) * 100 : 0
                    return (
                      <div key={role} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(role)}
                          <span className="capitalize font-medium">{role}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-secondary rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users table */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>A comprehensive list of all team members</CardDescription>
              <div className="flex items-center space-x-4 flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const name = user.name ?? user.email ?? "—"
                    const email = user.email ?? "—"
                    const department = user.department ?? "—"
                    const locationName = user.location_name ?? "—"
                    const status = user.status ?? "inactive"

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{getInitials(user)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{name}</div>
                              <div className="text-sm text-muted-foreground">{email}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center space-x-1 w-fit">
                            {getRoleIcon(user.role)}
                            <span className="capitalize">{user.role ?? "employee"}</span>
                          </Badge>
                        </TableCell>

                        <TableCell>{department}</TableCell>
                        <TableCell className="text-sm">{locationName}</TableCell>

                        <TableCell>
                          <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
                        </TableCell>

                        <TableCell className="text-sm">{formatLastLogin(user.last_login ?? undefined)}</TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Activity tabs kept as-is; they already use safe fallbacks in this file */}
        <TabsContent value="roles" className="space-y-4">
          {/* roles content (unchanged) */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* ... */}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name ?? user.email}</p>
                      <p className="text-sm text-muted-foreground">Last login: {formatLastLogin(user.last_login ?? undefined)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status ?? "inactive"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update the user details below." : "Enter the details for the new user."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* form fields (unchanged) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* ... rest of form fields kept same as you already had ... */}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role || ""}
                    onValueChange={(value) => setFormData({ ...formData, role: value as DatabaseUser["role"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department || ""}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Warehouse">Warehouse</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Inventory">Inventory</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    value={formData.location_id || ""}
                    onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input id="joinDate" type="date" value={formData.join_date || ""} onChange={(e) => setFormData({ ...formData, join_date: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status || ""} onValueChange={(value) => setFormData({ ...formData, status: value as DatabaseUser["status"] })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? "Update" : "Create"} User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
