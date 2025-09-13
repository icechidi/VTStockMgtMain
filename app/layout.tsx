import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/top-nav"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

import { NextAuthSessionProvider } from "@/components/session-provider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VT-Stock Management System",
  description: "Professional inventory management system",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session: import("next-auth").Session | null = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextAuthSessionProvider session={session}>
            <SidebarProvider>
              <div className="flex min-h-screen">
                <AppSidebar />
                <div className="flex flex-1 flex-col">
                  <TopNav />
                  <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
                </div>
              </div>
            </SidebarProvider>
          </NextAuthSessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
