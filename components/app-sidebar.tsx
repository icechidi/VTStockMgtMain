"use client";

import { Box, Home, Package, BarChart3, ArrowUpDown, Layers, Settings, Users, Warehouse } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Stock Items", url: "/stocks", icon: Package },
  { title: "Stock Movements", url: "/movements", icon: ArrowUpDown },
  { title: "Categories", url: "/categories", icon: Layers, key: "categories" },
  { title: "Locations", url: "/locations", icon: Warehouse, key: "locations" },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

const adminItems = [
  { title: "Users", url: "/users", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

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

      {/* Footer */}
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">VT-Stock MGT v2.0</div>
      </SidebarFooter>
    </Sidebar>
  );
}