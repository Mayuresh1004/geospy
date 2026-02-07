"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, Sparkles, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkUser()

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-background/5 backdrop-blur-md shadow-sm"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            <div className="p-1 rounded-lg bg-brand-500/20 border border-brand-500/30">
              <Sparkles className="h-5 w-5 text-brand-500" />
            </div>
            <span className="text-foreground">GEOspy</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              How it works
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            {!loading && user ? (
              <>
                <span className="text-sm text-muted-foreground mr-2">
                  {user.email}
                </span>
                <Button asChild variant="ghost">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild variant="premium">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl absolute w-full left-0 top-16 shadow-2xl">
          <nav className="container flex flex-col gap-4 py-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              How it works
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </Link>
            <div className="flex flex-col gap-3 pt-4 border-t border-border/10">
              {!loading && user ? (
                <>
                  <div className="text-xs text-muted-foreground px-2 py-2 bg-muted rounded">
                    {user.email}
                  </div>
                  <Button className="w-full justify-start" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button className="w-full" variant="premium" asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
