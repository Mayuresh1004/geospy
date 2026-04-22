"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

export async function getProfileByUserId(userId: string) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, email, avatar_url, is_admin, created_at, updated_at")
    .eq("id", userId)
    .single()

  if (error || !data) return null

  // Keep shape compatible with existing UI code that expects camelCase fields.
  return {
    id: data.id,
    username: data.username,
    fullName: data.full_name,
    email: data.email ?? null,
    avatarUrl: data.avatar_url,
    isAdmin: data.is_admin,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
