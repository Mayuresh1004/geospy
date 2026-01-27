import { getSupabaseServerClient } from "@/lib/supabase/forAuth"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/dashboard/settings-form"

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <SettingsForm profile={profile} userEmail={user.email || ""} />
    </div>
  )
}
