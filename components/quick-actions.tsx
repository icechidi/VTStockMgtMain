import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowUpDown, FileText, Search } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Add New Item",
      description: "Add a new stock item",
      icon: Plus,
      href: "/stocks/new",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Record Movement",
      description: "Log stock in/out",
      icon: ArrowUpDown,
      href: "/movements/new",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Generate Report",
      description: "Create inventory report",
      icon: FileText,
      href: "/reports",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Search Inventory",
      description: "Find specific items",
      icon: Search,
      href: "/stocks",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all"
              >
                <div className={`p-3 rounded-full text-white ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
