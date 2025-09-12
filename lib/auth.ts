// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

/**
 * This file reads DB_* env vars (matches your .env.local),
 * validates them, prints safe diagnostics (no secrets), and builds a pg Pool.
 */

function ensureStringEnv(name: string): string {
  const v = process.env[name];
  // log *type* and length only — do NOT print the secret itself
  console.log(`[env check] ${name}: type=${typeof v} ${v === undefined ? "(undefined)" : v === "" ? "(empty)" : `(length=${String(v).length})`}`);
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (typeof v !== "string") {
    throw new Error(`${name} must be a string but got ${typeof v}`);
  }
  return v;
}

// read DB_* variables (matching your .env.local)
const DB_USER = ensureStringEnv("DB_USER");
const DB_HOST = ensureStringEnv("DB_HOST");
const DB_NAME = ensureStringEnv("DB_NAME");
const DB_PASSWORD = ensureStringEnv("DB_PASSWORD");
const DB_PORT = Number(process.env.DB_PORT ?? 5432);

const USE_DATABASE_URL = !!process.env.DATABASE_URL;
if (USE_DATABASE_URL) console.log("[env check] Using DATABASE_URL");

// create the pool (prefers DATABASE_URL if present)
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      user: DB_USER,
      host: DB_HOST,
      database: DB_NAME,
      password: DB_PASSWORD,
      port: DB_PORT,
    });

// test acquiring a client once and log result (won't print secret)
(async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log("[db] Pool connection test: OK");
  } catch (err: any) {
    console.error("[db] Pool connection test: FAILED:", err.message ?? err);
    // do not rethrow so dev server can still start for debugging UI, but you'll see error here
  }
})();

export { pool };

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
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const result = await pool.query(
            `SELECT * FROM users WHERE lower(email) = $1 AND status = 'active' LIMIT 1`,
            [credentials.email.toLowerCase()]
          );
          if (result.rows.length === 0) return null;
          const dbUser = result.rows[0];

          // ensure hashed password is a string
          const hashed = String(dbUser.password ?? "");
          const isValid = await bcrypt.compare(credentials.password, hashed);
          if (!isValid) return null;

          // update last_login - optional if you already made a trigger
          await pool.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [dbUser.id]);

          return {
            id: dbUser.id.toString(),
            name: dbUser.name ?? null,
            email: dbUser.email ?? null,
            image: dbUser.image ?? null,
            role: dbUser.role ?? null,
            department: dbUser.department ?? null,
            phone: dbUser.phone ?? null,
            status: dbUser.status ?? null,
            location_id: dbUser.location_id ?? null,
          };
        } catch (err) {
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.role = u.role ?? null;
        token.department = u.department ?? null;
        token.phone = u.phone ?? null;
        token.status = u.status ?? null;
        token.location_id = u.location_id ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = (token as any).role ?? session.user.role ?? null;
        session.user.department = (token as any).department ?? session.user.department ?? null;
        session.user.phone = (token as any).phone ?? session.user.phone ?? null;
        session.user.status = (token as any).status ?? session.user.status ?? null;
        session.user.location_id = (token as any).location_id ?? session.user.location_id ?? null;
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
