import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Stock Management System",
  description: "Professional inventory management system",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap the ThemeProvider so the sidebar can use theme toggle */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ProtectedRoute>
            <SidebarProvider>
              {/* Removed activeTab/onTabChange props */}
              <AppSidebar />
              <main className="flex-1 overflow-auto">{children}</main>
            </SidebarProvider>
            </ProtectedRoute>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
