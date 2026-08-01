// lib/email.ts
import nodemailer, { type Transporter } from "nodemailer"

let cachedTransporter: Transporter | null | undefined

/**
 * Whether SMTP is actually configured. During local dev, .env.local ships
 * with placeholder values (your-email@gmail.com / your-app-password) --
 * we treat those as "not configured" so we fall back to console logging
 * instead of trying (and failing) to connect to a real SMTP server.
 */
function isEmailConfigured(): boolean {
  const { EMAIL_SERVER_HOST, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, EMAIL_FROM } = process.env
  if (!EMAIL_SERVER_HOST || !EMAIL_SERVER_USER || !EMAIL_SERVER_PASSWORD || !EMAIL_FROM) return false
  if (EMAIL_SERVER_USER.includes("your-email") || EMAIL_SERVER_PASSWORD.includes("your-app-password")) return false
  return true
}

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter

  if (!isEmailConfigured()) {
    cachedTransporter = null
    return cachedTransporter
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: Number(process.env.EMAIL_SERVER_PORT ?? 587) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })

  return cachedTransporter
}

export interface SendResult {
  sent: boolean
  /** true when the fallback (console logging) path was used instead of a real send */
  devFallback: boolean
}

/**
 * Sends a password reset code by email. If SMTP isn't configured (e.g. local
 * dev with placeholder env vars), falls back to logging the code to the
 * server console -- but ONLY outside production, so a misconfigured deploy
 * never silently leaks reset codes into logs instead of failing loudly.
 */
export async function sendPasswordResetEmail(to: string, code: string): Promise<SendResult> {
  const transporter = getTransporter()

  if (!transporter) {
    if (process.env.NODE_ENV === "production") {
      // Fail loudly in production rather than silently "succeeding" without
      // actually notifying the user.
      throw new Error("Email is not configured (EMAIL_SERVER_* env vars missing or placeholder values).")
    }
    console.log(`[dev only, email not configured] Password reset code for ${to}: ${code}`)
    return { sent: false, devFallback: true }
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Your VT Stock password reset code",
    text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes. If you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 4px;">Password reset code</h2>
        <p style="color: #555;">Use the code below to reset your password. It expires in 15 minutes.</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; background: #f4f4f5; padding: 16px 20px; border-radius: 8px; text-align: center;">${code}</p>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })

  return { sent: true, devFallback: false }
}
