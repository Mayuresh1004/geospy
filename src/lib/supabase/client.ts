import { createBrowserClient } from '@supabase/ssr'

export function getSupabaseBrowserClient() {
  // Use the PUBLIC keys here. These are safe to expose to the browser.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}