import { eq } from "drizzle-orm"
import { profiles } from "@/lib/supabase/schema"
import { db } from "@/lib/supabase/server"


export async function getProfileByUserId(userId: string) {
  const result = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  return result[0] ?? null
}
