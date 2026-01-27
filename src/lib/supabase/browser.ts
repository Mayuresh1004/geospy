import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient<Database>(url, anonKey)
}
