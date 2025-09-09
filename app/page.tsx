import { DashboardStats } from "@/components/dashboard-stats"
import { StockChart } from "@/components/stock-chart"
import { RecentMovements } from "@/components/recent-movements"
import { LowStockAlerts } from "@/components/low-stock-alerts"
import { QuickActions } from "@/components/quick-actions"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { MovementStats } from "@/components/movement-stats"

export default function Dashboard() {
  return (

  
    
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
      </div>

      <DashboardStats />


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <StockChart />
        </div>
        <div className="col-span-3">
          <RecentMovements />
        </div>
      </div>
    
          

              <div className="grid gap-6 md:grid-cols-2">
                <LowStockAlerts />
                <QuickActions />
               
              </div>
          <MovementStats movements={[]} />
          <MovementStats movements={[]} />
          

    </div>
    
  )
}
