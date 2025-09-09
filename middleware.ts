import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  const isLoginPage = request.nextUrl.pathname === "/login"
  const isPublicPath = request.nextUrl.pathname === "/login"

  // If user is not authenticated and trying to access protected routes
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is authenticated and trying to access login page
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
