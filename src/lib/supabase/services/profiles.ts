"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

type ProfileRow = {
  id: string
  username: string | null
  full_name: string | null
  email: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export async function getProfileByUserId(userId: string) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, email, avatar_url, is_admin, created_at, updated_at")
    .eq("id", userId)
    .single()

  if (error || !data) return null
  const row = data as unknown as ProfileRow

  // Keep shape compatible with existing UI code that expects camelCase fields.
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    email: row.email ?? null,
    avatarUrl: row.avatar_url,
    isAdmin: row.is_admin,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}
