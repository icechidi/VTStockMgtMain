// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/login",
  "/change-password",
  "/api/health",
  "/api/health/database",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

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
];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.startsWith("/fonts")) return true;
  if (/\.[^/]+$/.test(pathname)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow public paths right away; redirect "/" or "/login" appropriately if user is signed in
  if (isPublic(pathname)) {
    if (pathname === "/" || pathname === "/login") {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token) {
        // If user must change password, send them there instead
        if ((token as any).must_change_password) {
          return NextResponse.redirect(new URL("/change-password", req.url));
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    return NextResponse.next();
  }

  // For protected prefixes, require NextAuth token/session
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (needsAuth) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If user is required to change password, redirect them to /change-password
    if ((token as any).must_change_password && pathname !== "/change-password") {
      const changeUrl = new URL("/change-password", req.url);
      changeUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(changeUrl);
    }

    // token exists and not required to change password -> allow
    return NextResponse.next();
  }

  // default allow
  return NextResponse.next();
}

export const config = {
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
};
