// components/forgot-password-dialog.tsx
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Optional: allow parent to prefill email (e.g. from login input)
   */
  initialEmail?: string
}

export function ForgotPasswordDialog({ open, onOpenChange, initialEmail = "" }: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<"email" | "code" | "password">("email")
  const [email, setEmail] = useState(initialEmail)
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  // Reset dialog state whenever it is opened/closed
  useEffect(() => {
    if (!open) {
      // clear on close
      setStep("email")
      setEmail(initialEmail || "")
      setResetCode("")
      setNewPassword("")
      setConfirmPassword("")
      setLoading(false)
      setError("")
    } else {
      // when opened prefill email if provided
      setEmail(initialEmail || "")
      setStep("email")
      setResetCode("")
      setNewPassword("")
      setConfirmPassword("")
      setError("")
    }
  }, [open, initialEmail])

  // Helper to safely parse JSON with fallback
  const safeJson = async (res: Response) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError("Please enter your email address.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      if (response.ok) {
        setStep("code")
        toast({
          title: "Reset Code Sent",
          description: "If that email exists we sent a reset code. Check your inbox.",
        })
      } else {
        const data = await safeJson(response)
        setError(data?.error || "Failed to send reset code. Please try again.")
      }
    } catch (err) {
      console.error("Forgot password request failed:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const trimmedCode = resetCode.trim()
    if (!trimmedCode) {
      setError("Please enter the reset code.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: trimmedCode }),
      })

      if (response.ok) {
        setStep("password")
        toast({
          title: "Code verified",
          description: "Enter a new password to finish resetting your account.",
        })
      } else {
        const data = await safeJson(response)
        setError(data?.error || "Invalid reset code. Please check and try again.")
      }
    } catch (err) {
      console.error("Verify reset code failed:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: resetCode.trim(),
          newPassword,
        }),
      })

      if (response.ok) {
        toast({
          title: "Password Reset",
          description: "Your password has been reset successfully. You can now log in.",
        })
        onOpenChange(false)
      } else {
        const data = await safeJson(response)
        setError(data?.error || "Failed to reset password. Please try again.")
      }
    } catch (err) {
      console.error("Reset password failed:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setError("")
    if (step === "code") setStep("email")
    else if (step === "password") setStep("code")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== "email" && (
              <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            Reset Password
          </DialogTitle>
          <DialogDescription>
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "code" && "Enter the reset code sent to your email"}
            {step === "password" && "Enter your new password"}
          </DialogDescription>
        </DialogHeader>

        {step === "email" && (
          <form onSubmit={handleSendResetCode} className="space-y-4" aria-live="polite">
            <div className="space-y-2">
              <Label htmlFor="fp-email">Email Address</Label>
              <Input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send Reset Code
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4" aria-live="polite">
            <div className="space-y-2">
              <Label htmlFor="fp-code">Reset Code</Label>
              <Input
                id="fp-code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={10}
                required
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading || !resetCode.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Code
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-4" aria-live="polite">
            <div className="space-y-2">
              <Label htmlFor="fp-new">New Password</Label>
              <Input
                id="fp-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fp-confirm">Confirm Password</Label>
              <Input
                id="fp-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ForgotPasswordDialog
