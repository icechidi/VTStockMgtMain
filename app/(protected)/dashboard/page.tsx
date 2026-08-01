// app/(protected)/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { StockChart } from "@/components/dashboard/stock-chart";
import { RecentMovements } from "@/components/dashboard/recent-movements";
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { MovementStats } from "@/components/dashboard/movement-stats";
import { TopCategories } from "@/components/dashboard/top-categories";
import { SuppliersOverview } from "@/components/dashboard/suppliers-overview";
import { SystemHealth } from "@/components/dashboard/system-health";
import { LowStockBanner } from "@/components/dashboard/low-stock-banner";

export default async function DashboardPage() {
  // server-side session guard
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <LowStockBanner />

      <DashboardStats />

      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <StockChart />
        </div>
        <div className="lg:col-span-3">
          <RecentMovements />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LowStockAlerts />
        <QuickActions />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TopCategories />
        <SuppliersOverview />
        <SystemHealth />
      </div>

      <MovementStats movements={[]} />
    </div>
  );
}
