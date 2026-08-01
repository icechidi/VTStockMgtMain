// lib/auth.ts
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import PostgresAdapter from "@auth/pg-adapter"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import { rateLimit } from "./rate-limit"
import { logActivity } from "./activity-log"

function ensureStringEnv(name: string): string {
  const v = process.env[name]
  if (v === undefined) throw new Error(`Missing required environment variable: ${name}`)
  if (typeof v !== "string") throw new Error(`${name} must be a string`)
  return v
}

const DB_USER = ensureStringEnv("DB_USER")
const DB_HOST = ensureStringEnv("DB_HOST")
const DB_NAME = ensureStringEnv("DB_NAME")
const DB_PASSWORD = ensureStringEnv("DB_PASSWORD")
const DB_PORT = Number(process.env.DB_PORT ?? 5432)

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      user: DB_USER,
      host: DB_HOST,
      database: DB_NAME,
      password: DB_PASSWORD,
      port: DB_PORT,
    })

pool.on("error", (err) => {
  // Don't crash the process on idle client errors; just log at a safe level.
  console.error("[db] Unexpected pool error:", err.message)
})

export { pool }

// The password column name has drifted across this project's SQL migration
// scripts over time (some use `password_hash`, some use `password`). Rather
// than scanning every column on the user row for anything that looks like a
// bcrypt hash (the previous approach — risky, since it could match an
// unrelated column), we check a short, explicit allowlist of known column
// names in priority order.
//
// If your live `users` table uses a different column name, add it to this
// list.
const KNOWN_PASSWORD_COLUMNS = ["password_hash", "password"] as const

function getPasswordHash(dbUser: Record<string, unknown>): string | null {
  for (const col of KNOWN_PASSWORD_COLUMNS) {
    const v = dbUser[col]
    if (typeof v === "string" && v.startsWith("$2")) {
      return v
    }
  }
  return null
}

const LOGIN_RATE_LIMIT = 5 // attempts
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export const authOptions: NextAuthOptions = {
  adapter: PostgresAdapter(pool),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toLowerCase()

        // Rate limit by email + best-effort IP to slow down brute-force /
        // credential-stuffing attempts against a single account.
        const forwardedFor = (req?.headers as Record<string, string> | undefined)?.["x-forwarded-for"]
        const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown"
        const { allowed } = rateLimit(`login:${email}:${ip}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS)
        if (!allowed) {
          console.warn(`[auth] rate limit exceeded for login attempt (email=${email})`)
          return null
        }
        try {
          const result = await pool.query(`SELECT * FROM users WHERE lower(email) = $1 LIMIT 1`, [email])
          if (result.rows.length === 0) {
            await logActivity({
              action: "LOGIN_FAILED",
              entityType: "auth",
              entityName: email,
              description: `Failed login attempt for ${email} (no such account)`,
            })
            return null
          }
          const dbUser = result.rows[0]

          const hashed = getPasswordHash(dbUser)
          if (!hashed) {
            console.error(`[auth] no recognized password column for user id=${dbUser.id}`)
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, hashed)
          if (!isValid) {
            await logActivity({
              userId: dbUser.id?.toString(),
              userName: dbUser.name,
              action: "LOGIN_FAILED",
              entityType: "auth",
              entityName: email,
              description: `Failed login attempt for ${email} (incorrect password)`,
            })
            return null
          }

          if (dbUser.status && dbUser.status !== "active") {
            await logActivity({
              userId: dbUser.id?.toString(),
              userName: dbUser.name,
              action: "LOGIN_FAILED",
              entityType: "auth",
              entityName: email,
              description: `Login blocked for ${email} (account status: ${dbUser.status})`,
            })
            return null
          }

          const mustChange = Boolean(dbUser.must_change_password)

          // Update last_login (best-effort, non-blocking for the login flow)
          pool
            .query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [dbUser.id])
            .catch((err) => console.warn("[auth] last_login update failed:", (err as Error).message))

          await logActivity({
            userId: dbUser.id?.toString(),
            userName: dbUser.name,
            action: "LOGIN",
            entityType: "auth",
            entityName: dbUser.name ?? email,
            description: `${dbUser.name ?? email} logged in`,
          })

          return {
            id: dbUser.id?.toString() ?? null,
            name: dbUser.name ?? null,
            email: dbUser.email ?? null,
            image: (dbUser as any).image ?? null,
            role: dbUser.role ?? null,
            department: dbUser.department ?? null,
            phone: dbUser.phone ?? null,
            status: dbUser.status ?? null,
            location_id: dbUser.location_id ?? null,
            must_change_password: mustChange,
          }
        } catch (err) {
          console.error("[auth] authorize error:", err)
          return null
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = (user as any).id ?? token.sub
        token.name = (user as any).name ?? token.name
        token.email = (user as any).email ?? token.email
        token.picture = (user as any).image ?? token.picture
        token.role = (user as any).role ?? token.role
        token.department = (user as any).department ?? token.department
        token.phone = (user as any).phone ?? token.phone
        token.status = (user as any).status ?? token.status
        token.location_id = (user as any).location_id ?? token.location_id
        if ((user as any).must_change_password !== undefined) {
          token.must_change_password = Boolean((user as any).must_change_password)
        }
      }

      // Client called useSession().update(...) (e.g. after changing name or
      // uploading a new avatar in the profile dialog). Without this branch,
      // that call only updates React state in the current tab -- the change
      // is silently lost on the next page load/session fetch because it
      // never gets written into the actual JWT.
      if (trigger === "update" && session) {
        const updates = (session as any)?.user ?? session
        if (updates?.name !== undefined) token.name = updates.name
        if (updates?.email !== undefined) token.email = updates.email
        if (updates?.image !== undefined) token.picture = updates.image
        if (updates?.department !== undefined) token.department = updates.department
        if (updates?.phone !== undefined) token.phone = updates.phone
      }

      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub ?? session.user.id ?? null
        session.user.name = (token.name as string | undefined) ?? session.user.name ?? null
        session.user.email = (token.email as string | undefined) ?? session.user.email ?? null
        session.user.image = (token.picture as string | undefined) ?? session.user.image ?? null
        ;(session.user as any).role = (token as any).role ?? session.user.role ?? null
        ;(session.user as any).department = (token as any).department ?? session.user.department ?? null
        ;(session.user as any).phone = (token as any).phone ?? session.user.phone ?? null
        ;(session.user as any).status = (token as any).status ?? session.user.status ?? null
        ;(session.user as any).location_id = (token as any).location_id ?? session.user.location_id ?? null
        ;(session.user as any).must_change_password = Boolean((token as any).must_change_password ?? false)
      }
      return session
    },
  },
  pages: { signIn: "/login", error: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    async signOut({ token }) {
      await logActivity({
        userId: (token as any)?.sub ?? null,
        userName: (token as any)?.name ?? null,
        action: "LOGOUT",
        entityType: "auth",
        entityName: (token as any)?.name ?? (token as any)?.email ?? "user",
        description: `${(token as any)?.name ?? "A user"} logged out`,
      })
    },
  },
}

export default authOptions
