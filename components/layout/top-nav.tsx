"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { ProfileDialog } from "@/components/account/profile-dialog"
import { Bell, User, LogOut, Settings, Search, Loader2 } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import { getRouteMeta } from "@/lib/route-meta"
import { formatDate } from "@/lib/format-date"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  timestamp: string
  link?: string
  read: boolean
}

export function TopNav() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      const lastSeenRaw = typeof window !== "undefined" ? localStorage.getItem("notifications:lastSeen") : null
      const lastSeen = lastSeenRaw ? new Date(lastSeenRaw).getTime() : 0
      const items: Notification[] = (data.notifications ?? []).map((n: any) => ({
        ...n,
        read: new Date(n.timestamp).getTime() <= lastSeen,
      }))
      setNotifications(items)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setNotificationsLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.user) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user])

  const markAllNotificationsRead = () => {
    if (typeof window === "undefined") return
    localStorage.setItem("notifications:lastSeen", new Date().toISOString())
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const { section, title } = getRouteMeta(pathname)

  const today = formatDate(new Date())

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = searchValue.trim()
    setSearchOpen(false)
    router.push(term ? `/stocks?search=${encodeURIComponent(term)}` : "/stocks")
  }

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

  const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (!session?.user) return null

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4 lg:h-16 lg:px-6">
      <SidebarTrigger className="shrink-0" />

      {/* Breadcrumb + page title */}
      <div className="min-w-0 flex-1">
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          {section} / {title}
        </p>
        <h1 className="truncate text-sm font-semibold leading-tight sm:text-base">{title}</h1>
      </div>

      {/* Date - desktop only */}
      <span className="hidden shrink-0 text-xs text-muted-foreground lg:block">{today}</span>

      {/* Theme toggle */}
      <div className="hidden shrink-0 sm:block">
        <ThemeToggle />
      </div>

      {/* Search */}
      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search inventory</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <Input
              autoFocus
              placeholder="Search stock items..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <Button type="submit" size="sm">
              Go
            </Button>
          </form>
        </PopoverContent>
      </Popover>

      {/* Notifications */}
      <Popover onOpenChange={(open) => open && markAllNotificationsRead()}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative shrink-0 bg-transparent">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 shrink-0 items-center justify-center p-0 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Notifications</h4>
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          </div>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {notificationsLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    role={notification.link ? "button" : undefined}
                    onClick={() => notification.link && router.push(notification.link)}
                    className={`cursor-pointer rounded-lg border p-2.5 hover:bg-muted/50 ${
                      !notification.read ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <p className="text-[11px] text-muted-foreground">{formatRelativeTime(notification.timestamp)}</p>
                      </div>
                      {!notification.read && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
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
          <Button variant="secondary" size="icon" className="shrink-0 rounded-full">
            <Avatar className="h-7 w-7">
              <AvatarImage src={session.user.image || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
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
          <DropdownMenuItem onClick={handleLogout} className="text-destructive" disabled={isLoggingOut}>
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
