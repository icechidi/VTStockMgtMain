// app/(protected)/layout.tsx
import type React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RequirePasswordChangeRedirect from "./RequirePasswordChangeRedirect"

/**
 * Protected route-group layout.
 *
 * IMPORTANT:
 * - This file must live at app/(protected)/layout.tsx
 * - It does NOT render AppSidebar/TopNav or providers — RootLayout already does that.
 * - Its only purpose is to enforce server-side auth for the (protected) route group.
 */

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Redirect unauthenticated users to the login page
    redirect("/login");
  }

  // If authenticated, simply render the children.
  // RootLayout provides the global layout (sidebar, topnav, main wrapper).
  return (
    <>
      <RequirePasswordChangeRedirect />
      {children}
    </>
  );
}
