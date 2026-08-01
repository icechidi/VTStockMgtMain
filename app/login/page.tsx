// app/(public)/login/page.tsx  (or wherever your login page is)
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ForgotPasswordDialog } from "@/components/account/forgot-password-dialog"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session?.user?.id) {
        router.replace("/dashboard")
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password. Please check your credentials and try again.")
        toast({
          title: "Login Failed",
          description: "Invalid email or password.",
          variant: "destructive",
        })
      } else if (result?.ok) {
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to dashboard...",
        })
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setError("An error occurred during login. Please try again.")
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handler passed to ForgotPasswordDialog (optional)
  const handleForgotPasswordSubmit = async (payload: { email: string }) => {
    // This example assumes you have an endpoint at /api/auth/forgot-password
    // that accepts { email } and sends a reset link or similar.
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({
          title: "Check your email",
          description: "If that email exists we sent a reset link.",
        })
        setForgotPasswordOpen(false)
        return { ok: true }
      } else {
        const err = await res.json().catch(() => ({}))
        toast({
          title: "Request failed",
          description: err?.message || "Failed to request password reset.",
          variant: "destructive",
        })
        return { ok: false }
      }
    } catch (err) {
      console.error("Forgot password request failed:", err)
      toast({
        title: "Network error",
        description: "Could not send request. Please try again later.",
        variant: "destructive",
      })
      return { ok: false }
    }
  }

  return (
    // Fullscreen fixed wrapper so the card always sits in the center of the viewport
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border shadow-2xl">
          <CardHeader className="space-y-4 pb-6 text-center">
            <div className="mb-2 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                V
              </div>
            </div>
            <div>
              <CardTitle className="text-xl font-bold">VT-Stock MGT</CardTitle>
              <CardDescription className="mt-1.5">Sign in to your account to continue</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Forgot Password Link */}
            <div className="mt-4 text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground hover:text-primary"
                onClick={() => setForgotPasswordOpen(true)}
                disabled={isLoading}
              >
                Forgot your password?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- Render the ForgotPasswordDialog ----
          - Provide open/onOpenChange so the dialog can open/close.
          - Provide onSubmit (optional) which should accept { email } and return { ok: boolean }.
          If your existing ForgotPasswordDialog uses different props adjust accordingly.
      */}
      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
      />
    </div>
  )
}
