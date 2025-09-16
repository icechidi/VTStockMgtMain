import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardStats } from "@/components/dashboard-stats"
import { LowStockAlerts } from "@/components/low-stock-alerts"
import { RecentMovements } from "@/components/recent-movements"
import { MovementStats } from "@/components/movement-stats"
import { QuickActions } from "@/components/quick-actions"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <QuickActions />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStats />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <MovementStats movements={[]} />
        </div>
        <div className="col-span-3">
          <LowStockAlerts />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        <RecentMovements />
      </div>
    </div>
  )
}
