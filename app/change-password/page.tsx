// app/change-password/page.tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const search = useSearchParams()
  const returnUrl = search?.get("returnUrl") ?? "/dashboard"
  const { status } = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast({ title: "Weak password", description: "Password must be at least 8 characters", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        toast({ title: "Error", description: body?.error ?? "Failed to change password", variant: "destructive" })
        return
      }

      toast({ title: "Success", description: "Password changed. Please sign in again." })

      // sign out to force a fresh session token without must_change_password
      await signOut({ callbackUrl: "/login" })
    } catch (err) {
      console.error("change pw error:", err)
      toast({ title: "Error", description: "Server error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // if not authenticated, redirect to login
  if (status === "unauthenticated") {
    if (typeof window !== "undefined") router.push("/login")
    return null
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Change password</h1>
      <p className="text-sm text-muted-foreground mb-4">
        You were required to change your password before continuing.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="current">Current password</Label>
          <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="new">New password</Label>
          <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Change password"}</Button>
          <Button variant="outline" onClick={() => router.push("/login")}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
