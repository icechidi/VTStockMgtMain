import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowUpDown, FileText, Search, Building2, Bell, Activity, Wrench } from "lucide-react"
import Link from "next/link"

const actions = [
  {
    title: "Add New Item",
    description: "Add a new stock item",
    icon: Plus,
    href: "/stocks/new",
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    title: "Record Movement",
    description: "Log stock in/out",
    icon: ArrowUpDown,
    href: "/movements/new",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    title: "Generate Report",
    description: "Create inventory report",
    icon: FileText,
    href: "/reports",
    color: "text-[hsl(var(--chart-5))]",
    bg: "bg-[hsl(var(--chart-5))]/10",
  },
  {
    title: "Search Inventory",
    description: "Find specific items",
    icon: Search,
    href: "/stocks",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    title: "Manage Suppliers",
    description: "View & edit suppliers",
    icon: Building2,
    href: "/suppliers",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    title: "Set Alerts",
    description: "Configure notifications",
    icon: Bell,
    href: "/alerts",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    title: "Repairs",
    description: "Track item repairs",
    icon: Wrench,
    href: "/repairs",
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    title: "Activity Logs",
    description: "View recent activity",
    icon: Activity,
    href: "/activity-logs",
    color: "text-[hsl(var(--chart-5))]",
    bg: "bg-[hsl(var(--chart-5))]/10",
  },
]

export function QuickActions() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <div className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.bg}`}>
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{action.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{action.description}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
