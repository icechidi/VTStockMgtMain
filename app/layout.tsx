import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Stock Management System",
  description: "Professional inventory management system",
    generator: 'v0.dev'
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={inter.className}>
{/* Wrapped the ThemeProvider  to the main sidebar to allows us to use the theme toggle and manage themes */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SidebarProvider>
          <AppSidebar activeTab="dashboard" onTabChange={() => {}} />
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarProvider>
        <Toaster />
      </ThemeProvider>
      </body>
    </html>
  )
}
