// types/profile.ts
import type { InferSelectModel } from "drizzle-orm"
import { profiles } from "@/lib/supabase/schema"

export type Profile = InferSelectModel<typeof profiles>
