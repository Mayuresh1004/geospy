"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Settings, CreditCard, CheckSquare, LogOut } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Todos", href: "/dashboard/todos", icon: CheckSquare },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          SaaS MVP
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
