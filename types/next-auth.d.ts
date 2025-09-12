// next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  /**
   * Match your Postgres users table:
   *  - id is stored as serial (number) in DB but NextAuth often uses string IDs in the session/jwt,
   *    so we declare `id` as string to match what you return from authorize() (id.toString()).
   *
   * Fields that can be null in DB are marked `string | null` or optional.
   */
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
    department?: string | null;
    phone?: string | null;
    status?: string | null;
    location_id?: number | null;
  }

  interface Session {
    user: User;
    // keep other DefaultSession props (expires) if needed — we only augment `user`
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string | null;
    department?: string | null;
    phone?: string | null;
    status?: string | null;
    location_id?: number | null;
  }
}
