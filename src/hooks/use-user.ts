"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { getProfileByUserId } from "@/lib/supabase/services/profiles"
import type { Profile } from "@/types/profile"

interface UseUserResult {
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setUser(user)

      if (user) {
        const profile = await getProfileByUserId(user.id)
        setProfile(profile)
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setProfile(null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return { user, profile, loading }
}
