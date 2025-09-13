// app/page.tsx (server component)
import { redirect } from "next/navigation"

export default function Page() {
  // Always redirect root to login so app opens on the login screen
  redirect("/login")
}
