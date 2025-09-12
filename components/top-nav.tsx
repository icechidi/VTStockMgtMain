"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProfileDialog } from "@/components/profile-dialog"
import { Bell, User, LogOut, Settings, Menu, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "@/components/app-sidebar"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  timestamp: string
  read: boolean
}

export function TopNav() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Low Stock Alert",
      message: "iPhone 13 Pro is running low (5 units remaining)",
      type: "warning",
      timestamp: "2 minutes ago",
      read: false,
    },
    {
      id: "2",
      title: "New Stock Movement",
      message: "100 units of Samsung Galaxy S23 added to Main Warehouse",
      type: "success",
      timestamp: "1 hour ago",
      read: false,
    },
    {
      id: "3",
      title: "System Update",
      message: "Inventory system will be updated tonight at 2 AM",
      type: "info",
      timestamp: "3 hours ago",
      read: true,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({
        redirect: false,
        callbackUrl: "/login",
      })
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
      router.push("/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      case "success":
        return "✅"
      default:
        return "ℹ️"
    }
  }

  if (!session?.user) return null

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <AppSidebar />
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <h1 className="text-lg font-semibold md:text-2xl">Inventory Management System</h1>
      </div>

      {/* Notifications */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative bg-transparent">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Notifications</h4>
            <Badge variant="secondary">{unreadCount} new</Badge>
          </div>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                      !notification.read ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                      </div>
                      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* User Profile Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image || "/placeholder.svg"} />
              <AvatarFallback>
                {session.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session.user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
              <p className="text-xs leading-none text-muted-foreground capitalize">
                {"role" in session.user && typeof (session.user as any).role === "string"
                  ? (session.user as any).role
                  : "User"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600" disabled={isLoggingOut}>
            {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            {isLoggingOut ? "Logging out..." : "Logout"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Dialog */}
      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </header>
  )
}
