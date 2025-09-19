// e.g. in app/(protected)/page.tsx, or in a top-level wrapper component
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
        // optionally include a returnUrl so user goes back afterwards
        router.push("/change-password")
      }
    }
  }, [session, status, router])

  return null
}
