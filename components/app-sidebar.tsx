"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProfileDialog } from "@/components/profile-dialog"
import { useToast } from "@/hooks/use-toast"
import {Home, Package, BarChart3, ArrowUpDown, Layers, Settings, Box, Users, Warehouse, Bell, User, LogOut, Loader2} from "lucide-react";
import {Sidebar,SidebarContent, SidebarGroup,SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, 
  SidebarMenuItem, SidebarHeader, SidebarFooter,} from "@/components/ui/sidebar";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface SidebarProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Stock Items",
    url: "/stocks",
    icon: Package,
  },
  {
    title: "Stock Movements",
    url: "/movements",
    icon: ArrowUpDown,
  },
  {
    title: "Categories",
    url: "/categories",
    icon: Layers,
  },
  {
    title: "Locations",
    url: "/locations",
    icon: Warehouse,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Alerts", // <-- Add Alerts menu item
    url: "/alerts",
    icon: Bell,
  },
];

const adminItems = [
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar({ activeTab, onTabChange }: SidebarProps) {

  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname(); // ✅ detect current URL
  const { toast } = useToast()

  const handleNavigation = (item: (typeof items)[0]) => {
    if (onTabChange) {
      onTabChange(item.title)
    } else {
      router.push(item.url)
    }
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

  const isActive = (item: (typeof items)[0]) => {
    if (activeTab) {
      return activeTab === item.title
    }
    return pathname === item.url
  }

  if (!session?.user) return null

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Box className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold">VT-Stock MGT</span>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent>
        {/* Main Menu Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`flex items-center gap-2 ${
                        pathname === item.url ? "text-primary font-semibold" : ""
                      }`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`flex items-center gap-2 ${
                        pathname === item.url ? "text-primary font-semibold" : ""
                      }`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>



      {/* Profile Dialog */}
      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />

      
        {/* User Profile Section */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || "/placeholder.svg"} />
                  <AvatarFallback>
                    {session.user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium">{session.user.name}</span>
                  <span className="text-muted-foreground capitalize">{(session.user as { role?: string })?.role ?? "User"}</span>
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
              <DropdownMenuItem onClick={handleLogout} className="text-red-600" disabled={isLoggingOut}>
                {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                {isLoggingOut ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>



      {/* Footer */}
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">VT-Stock MGT v2.0</div>
      </SidebarFooter>

    </Sidebar>

    
  );
}

// function signOut(arg0: { redirect: boolean; callbackUrl: string; }) {
//   throw new Error("Function not implemented.");
// }

