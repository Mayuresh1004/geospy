// lib/auth.ts
import { getSupabaseServerClient } from "@/lib/supabase/forAuth";
import { cookies } from "next/headers";

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}