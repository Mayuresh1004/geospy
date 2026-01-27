"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"
import { useUser } from "./use-user"

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (!user || !supabase) {
      setSubscription(null)
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()

        if (!error && data) {
          setSubscription(data)
        } else {
          setSubscription(null)
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
        setSubscription(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user, supabase])

  return { subscription, loading }
}
