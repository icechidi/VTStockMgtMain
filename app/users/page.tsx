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
  name: string
  email: string
  role: "admin" | "manager" | "employee" | "viewer"
  status: "active" | "inactive"
  location_id: string
  location_name?: string
  location_code?: string
  avatar?: string
  join_date: string
  phone?: string
  department?: string
  last_login?: string
  created_at: string
  updated_at: string
}

interface Location {
  id: string
  name: string
  code: string
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
        setUsers(data)
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
        setLocations(data)
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesLocation = locationFilter === "all" || user.location_id === locationFilter
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
        setUsers(users.filter((user) => user.id !== id))
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
      } else {
        throw new Error("Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
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

      if (response.ok) {
        const userData = await response.json()

        if (editingUser) {
          setUsers(users.map((user) => (user.id === editingUser.id ? userData : user)))
          toast({
            title: "Success",
            description: "User updated successfully",
          })
        } else {
          setUsers([...users, userData])
          toast({
            title: "Success",
            description: "User created successfully",
          })
        }

        setIsDialogOpen(false)
        setFormData({})
      } else {
        throw new Error("Failed to save user")
      }
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

  const getRoleIcon = (role: string) => {
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

  const getRoleBadgeVariant = (role: string) => {
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
                  {users.filter((u) => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}{" "}
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
                  {Math.round((users.filter((u) => u.status === "active").length / users.length) * 100)}% of total
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

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest team members added</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((user) => (
                      <div key={user.id} className="flex items-center space-x-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </div>
                    ))}
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
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center space-x-1 w-fit">
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department || "—"}</TableCell>
                      <TableCell className="text-sm">{user.location_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatLastLogin(user.last_login)}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>Manage what each role can access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      role: "admin",
                      icon: Crown,
                      color: "text-red-600",
                      permissions: ["Full System Access", "User Management", "System Settings", "All Reports"],
                    },
                    {
                      role: "manager",
                      icon: Shield,
                      color: "text-blue-600",
                      permissions: ["Inventory Management", "User Oversight", "Reports", "Location Management"],
                    },
                    {
                      role: "employee",
                      icon: UsersIcon,
                      color: "text-green-600",
                      permissions: ["Inventory Updates", "Movement Records", "Basic Reports"],
                    },
                    {
                      role: "viewer",
                      icon: UsersIcon,
                      color: "text-gray-600",
                      permissions: ["View Only", "Basic Reports"],
                    },
                  ].map(({ role, icon: Icon, color, permissions }) => (
                    <div key={role} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Icon className={`h-5 w-5 ${color}`} />
                        <h4 className="font-semibold capitalize">{role}</h4>
                        <Badge variant="outline">{users.filter((u) => u.role === role).length} users</Badge>
                      </div>
                      <div className="space-y-1">
                        {permissions.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span>{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Access</CardTitle>
                <CardDescription>Users by location assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {locations.map((location) => {
                    const locationUsers = users.filter((u) => u.location_id === location.id)
                    return (
                      <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{location.name}</p>
                            <p className="text-sm text-muted-foreground">Code: {location.code}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{locationUsers.length} users</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
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
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">Last login: {formatLastLogin(user.last_login)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={formData.join_date || ""}
                    onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || ""}
                    onValueChange={(value) => setFormData({ ...formData, status: value as DatabaseUser["status"] })}
                  >
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
