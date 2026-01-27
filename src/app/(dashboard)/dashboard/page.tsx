import { getSupabaseServerClient } from "@/lib/supabase/forAuth"
import { redirect } from "next/navigation"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import { Users, DollarSign, Activity, TrendingUp, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let profile = null
  let todosCount = 0
  let databaseError = false

  try {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      if (profileError.code === "PGRST205") {
        databaseError = true
      } else {
        console.error("[v0] Profile fetch error:", profileError)
      }
    } else if (!profileData) {
      console.log("[v0] No profile found, creating one for user:", user.id)
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          username: user.email?.split("@")[0] || `user_${user.id.slice(0, 8)}`,
        })
        .select()
        .single()

      if (createError) {
        console.error("[v0] Profile creation error:", createError)
        if (createError.code === "PGRST205" || createError.code === "42P01") {
          databaseError = true
        }
      } else {
        profile = newProfile
      }
    } else {
      profile = profileData
    }
  } catch (error) {
    console.error("[v0] Database error:", error)
    databaseError = true
  }

  if (databaseError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to SaaS MVP!</h1>
          <p className="text-muted-foreground">Let&apos;s get your database set up.</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Setup Required</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>Your Supabase database needs to be initialized with the required tables.</p>
            <div className="space-y-2">
              <p className="font-semibold">To set up your database:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click the &quot;Run Script&quot; button below to execute the database migration</li>
                <li>
                  Or manually run the script from{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">scripts/001_initial_schema.sql</code> in your Supabase
                  SQL Editor
                </li>
              </ol>
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer">
                  Open Supabase SQL Editor
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">What will be created:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              ✓ <strong>profiles</strong> - User profile information
            </li>
            <li>
              ✓ <strong>subscriptions</strong> - Payment subscription management
            </li>
            <li>
              ✓ <strong>payments</strong> - Payment history tracking
            </li>
            <li>
              ✓ <strong>todos</strong> - Example CRUD functionality
            </li>
            <li>✓ Row Level Security (RLS) policies for data protection</li>
            <li>✓ Automatic profile creation on user signup</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.full_name || "User"}!</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your account today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Revenue" value="$12,345" description="+20.1% from last month" icon={DollarSign} />
        <StatsCard title="Active Users" value="573" description="+15% from last month" icon={Users} />
        <StatsCard
          title="Tasks Completed"
          value={todosCount?.toString() || "0"}
          description="Total todos created"
          icon={Activity}
        />
        <StatsCard title="Growth Rate" value="+12.5%" description="+2.5% from last month" icon={TrendingUp} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <ActivityChart />
        </div>
        <div className="col-span-3">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Account created</p>
                  <p className="text-xs text-muted-foreground">Welcome to SaaS MVP</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile updated</p>
                  <p className="text-xs text-muted-foreground">Your profile information was updated</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">First login</p>
                  <p className="text-xs text-muted-foreground">You signed in for the first time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
