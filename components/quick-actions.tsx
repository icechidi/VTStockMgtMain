import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // UI card components
import { Button } from "@/components/ui/button" // Button component
import { Plus, ArrowUpDown, FileText, Search } from "lucide-react" // Icon imports
import Link from "next/link" // Next.js Link component for navigation

// QuickActions component - displays a set of shortcut buttons for common actions
export function QuickActions() {
  // Array of action objects defining each quick action's properties
  const actions = [
    {
      title: "Add New Item", // Button title
      description: "Add a new stock item", // Button subtitle/description
      icon: Plus, // Icon component
      href: "/stocks/new", // Navigation target
      color: "bg-blue-500 hover:bg-blue-600", // Background and hover color
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
        <CardTitle>Quick Actions</CardTitle> {/* Section title */}
      </CardHeader>
      <CardContent>
        {/* Responsive grid layout for action buttons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {actions.map((action, index) => (
            // Each action is a clickable Link that wraps a Button
            <Link key={index} href={action.href}>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all" // Styling for button layout and hover effect
              >
                {/* Icon container with background color */}
                <div className={`p-3 rounded-full text-white ${action.color}`}>
                  <action.icon className="h-6 w-6" /> {/* Action icon */}
                </div>
                {/* Text section for title and description */}
                <div className="text-center">
                  <div className="font-medium">{action.title}</div> {/* Action title */}
                  <div className="text-xs text-muted-foreground">{action.description}</div> {/* Subtitle */}
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
