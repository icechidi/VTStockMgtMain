// app/(protected)/RequirePasswordChangeRedirect.tsx
"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function RequirePasswordChangeRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      const mustChange = (session?.user as any)?.must_change_password
      if (mustChange) {
        // If user is flagged, send them to change-password page
        // include returnUrl so they can come back after successful flow if desired
        const current = window.location.pathname
        const url = new URL("/change-password", window.location.origin)
        url.searchParams.set("returnUrl", current)
        router.push(url.pathname + url.search)
      }
    }
  }, [session, status, router])

  return null
}
