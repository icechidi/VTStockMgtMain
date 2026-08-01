// lib/route-meta.ts
//
// Maps a pathname to { section, title } for the breadcrumb + page title
// shown in the top header bar. Centralizing this here means every page gets
// a consistent header for free, instead of each page re-implementing its
// own breadcrumb markup.

export interface RouteMeta {
  section: string
  title: string
}

const ROUTES: Array<{ prefix: string; meta: RouteMeta }> = [
  { prefix: "/dashboard", meta: { section: "Main Menu", title: "Dashboard" } },
  { prefix: "/stocks/new", meta: { section: "Stock Items", title: "Add Stock Item" } },
  { prefix: "/stocks", meta: { section: "Main Menu", title: "Stock Items" } },
  { prefix: "/movements/new", meta: { section: "Stock Movements", title: "Record Movement" } },
  { prefix: "/movements", meta: { section: "Main Menu", title: "Stock Movements" } },
  { prefix: "/categories", meta: { section: "Main Menu", title: "Categories" } },
  { prefix: "/locations", meta: { section: "Main Menu", title: "Locations" } },
  { prefix: "/reports", meta: { section: "Main Menu", title: "Reports" } },
  { prefix: "/alerts", meta: { section: "Main Menu", title: "Alerts" } },
  { prefix: "/suppliers", meta: { section: "Main Menu", title: "Suppliers" } },
  { prefix: "/repairs/new", meta: { section: "Repairs", title: "New Repair" } },
  { prefix: "/repairs", meta: { section: "Main Menu", title: "Repairs" } },
  { prefix: "/users", meta: { section: "Administration", title: "Users" } },
  { prefix: "/activity-logs", meta: { section: "Administration", title: "Activity Logs" } },
  { prefix: "/settings", meta: { section: "Administration", title: "Settings" } },
  { prefix: "/change-password", meta: { section: "Account", title: "Change Password" } },
]

export function getRouteMeta(pathname: string | null): RouteMeta {
  if (!pathname) return { section: "Main Menu", title: "Dashboard" }
  const match = ROUTES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"))
  return match?.meta ?? { section: "Main Menu", title: "Dashboard" }
}
