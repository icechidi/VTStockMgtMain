// middleware.ts
import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/health",
  "/api/health/database",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/stocks",
  "/movements",
  "/settings",
  "/users",
  "/categories",
  "/locations",
  "/reports",
  "/alerts",
]

// helper
function isPublic(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true
  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.startsWith("/fonts")) return true
  // allow common static files
  if (/\.[^/]+$/.test(pathname)) return true
  return false
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Always allow public paths and assets
  if (isPublic(pathname)) {
    // If user has token and tries to access /login or /, redirect to dashboard
    const token = req.cookies.get("auth_token")?.value
    if (token && (pathname === "/login" || pathname === "/")) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // For protected prefixes, require token
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
  if (needsAuth) {
    const token = req.cookies.get("auth_token")?.value
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }
    // If token exists, allow (optionally validate token here)
    return NextResponse.next()
  }

  // Default: allow
  return NextResponse.next()
}

export const config = {
  // match root + protected paths + login so middleware handles navigation to them
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/stocks/:path*",
    "/movements/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/categories/:path*",
    "/locations/:path*",
    "/reports/:path*",
    "/alerts/:path*",
    "/api/health/:path*",
  ],
}
