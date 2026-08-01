"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import { ProfileDialog } from "@/components/account/profile-dialog"
import { useToast } from "@/hooks/use-toast"
import {Home, Package, BarChart3, Building2, Activity, ArrowUpDown, Layers, Settings, Users, Warehouse, Bell, User, LogOut, Loader2, Wrench} from "lucide-react";
import {Sidebar,SidebarContent, SidebarGroup,SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarTrigger,} from "@/components/ui/sidebar";

import Link from "next/link";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Stock Items", url: "/stocks", icon: Package },
  { title: "Stock Movements", url: "/movements", icon: ArrowUpDown },
  { title: "Categories", url: "/categories", icon: Layers },
  { title: "Locations", url: "/locations", icon: Warehouse },
  { title: "Repairs", url: "/repairs", icon: Wrench },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Suppliers", url: "/suppliers", icon: Building2 },
];

const adminItems = [
  { title: "Users", url: "/users", icon: Users },
  { title: "Activity Logs", url: "/activity-logs", icon: Activity },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ redirect: false, callbackUrl: "/login" })
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

  if (!session?.user) return null

  const renderNavGroup = (label: string, groupItems: typeof items) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] tracking-wide">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {groupItems.map((item) => {
            const active = pathname === item.url || pathname?.startsWith(item.url + "/")
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link href={item.url} className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="flex-row items-center justify-between gap-2 border-b p-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            V
          </div>
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">VT-Stock MGT</span>
        </div>
        <SidebarTrigger className="shrink-0 group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className="thin-scrollbar">
        {renderNavGroup("Main Menu", items)}
        {renderNavGroup("Administration", adminItems)}
      </SidebarContent>

      {/* Profile Dialog */}
      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />

      {/* Footer: user + version */}
      <SidebarFooter className="gap-0 border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start gap-2.5 p-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={session.user.image || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">
                  {session.user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col items-start text-xs group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{session.user.name}</span>
                <span className="truncate capitalize text-muted-foreground">
                  {(session.user as { role?: string })?.role ?? "User"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive" disabled={isLoggingOut}>
              {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              {isLoggingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="px-2 pt-1 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          VT-Stock MGT v2.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
