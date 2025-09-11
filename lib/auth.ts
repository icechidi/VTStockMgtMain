import type { NextAuthOptions, User as NextAuthUser } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import PostgresAdapter from "@auth/pg-adapter"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    department?: string;
    phone?: string;
    status?: string;
    location_id?: number;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      department?: string;
      phone?: string;
      status?: string;
      location_id?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    department?: string;
    phone?: string;
    status?: string;
    location_id?: number;
  }
}

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
})

export const authOptions: NextAuthOptions = {
  adapter: PostgresAdapter(pool),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const result = await pool.query("SELECT * FROM users WHERE email = $1 AND status = 'active'", [
            credentials.email.toLowerCase(),
          ])

          if (result.rows.length === 0) {
            return null
          }

          const user = result.rows[0]

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)

          if (!isValidPassword) {
            return null
          }

          // Update last login
          await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id])

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            department: user.department,
            phone: user.phone,
            status: user.status,
            location_id: user.location_id,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.department = user.department
        token.phone = user.phone
        token.status = user.status
        token.location_id = user.location_id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.department = token.department as string
        session.user.phone = token.phone as string
        session.user.status = token.status as string
        session.user.location_id = token.location_id as number
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
