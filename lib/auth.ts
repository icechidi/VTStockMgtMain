// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

function ensureStringEnv(name: string): string {
  const v = process.env[name];
  if (v === undefined) throw new Error(`Missing required environment variable: ${name}`);
  if (typeof v !== "string") throw new Error(`${name} must be a string`);
  console.log(`[env check] ${name}: type=${typeof v} (length=${String(v).length})`);
  return v;
}

const DB_USER = ensureStringEnv("DB_USER");
const DB_HOST = ensureStringEnv("DB_HOST");
const DB_NAME = ensureStringEnv("DB_NAME");
const DB_PASSWORD = ensureStringEnv("DB_PASSWORD");
const DB_PORT = Number(process.env.DB_PORT ?? 5432);

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      user: DB_USER,
      host: DB_HOST,
      database: DB_NAME,
      password: DB_PASSWORD,
      port: DB_PORT,
    });

// quick pool sanity
(async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log("[db] Pool connection test: OK");
  } catch (err: any) {
    console.error("[db] Pool connection test: FAILED:", err.message ?? err);
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
        console.log("[auth] authorize called, credentials present?", !!credentials);
        if (!credentials || !credentials.email || !credentials.password) {
          console.log("[auth] missing credentials.email or credentials.password");
          return null;
        }

        try {
          const email = credentials.email.toLowerCase();
          const q = `SELECT * FROM users WHERE lower(email) = $1 LIMIT 1`;
          const result = await pool.query(q, [email]);
          if (result.rows.length === 0) {
            console.log("[auth] no user found for", email);
            return null;
          }
          const dbUser = result.rows[0];
          console.log("[auth] user found id=", dbUser.id, "status=", dbUser.status);

          // Auto-detect bcrypt-like hash in any string column
          const bcryptRegex = /^\$2[aby]\$/;
          let hashed: string | undefined;
          let detectedColumn: string | undefined;
          for (const k of Object.keys(dbUser)) {
            const v = dbUser[k];
            if (typeof v === "string" && bcryptRegex.test(v)) {
              hashed = v;
              detectedColumn = k;
              break;
            }
          }

          if (!hashed) {
            console.log("[auth] no bcrypt-like hash found on user row; cannot authenticate");
            return null;
          }
          console.log(`[auth] detected hashed-password in column "${detectedColumn}" (len=${hashed.length})`);

          const isValid = await bcrypt.compare(credentials.password, hashed);
          console.log("[auth] bcrypt.compare =>", isValid);
          if (!isValid) return null;

          // optional: require active status
          if (dbUser.status && dbUser.status !== "active") {
            console.log("[auth] user not active:", dbUser.status);
            return null;
          }

          // update last_login
          try {
            await pool.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [dbUser.id]);
          } catch (err) {
            console.warn("[auth] last_login update failed:", (err as Error).message);
          }

          return {
            id: dbUser.id?.toString() ?? null,
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
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role ?? null;
        token.department = user.department ?? null;
        token.phone = user.phone ?? null;
        token.status = user.status ?? null;
        token.location_id = user.location_id ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub ?? (token as any).id ?? session.user.id ?? null;
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
