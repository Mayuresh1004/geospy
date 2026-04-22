import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const apiRateLimitStore = new Map<string, number[]>()
let lastRateLimitSweepAt = 0

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, allow all requests through
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase credentials not configured. Auth protection is disabled.")
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    // Refresh session if expired - with timeout protection
    const {
      data: { user },
    } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null } }>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase request timeout")), 5000),
      ),
    ])

    // API rate limit for project routes (10 req/min per user)
    if (request.nextUrl.pathname.startsWith("/api/projects")) {
      const key = user?.id ?? request.headers.get("x-forwarded-for") ?? "anon"
      const now = Date.now()
      const windowStart = now - RATE_LIMIT_WINDOW_MS
      const existing = apiRateLimitStore.get(key) ?? []
      const recent = existing.filter((ts) => ts > windowStart)

      if (recent.length >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Max 10 requests per minute." },
          { status: 429 }
        )
      }
      recent.push(now)
      apiRateLimitStore.set(key, recent)

      // Lightweight periodic cleanup to avoid unbounded memory growth.
      if (now - lastRateLimitSweepAt > RATE_LIMIT_WINDOW_MS) {
        for (const [k, timestamps] of apiRateLimitStore.entries()) {
          const filtered = timestamps.filter((ts) => ts > windowStart)
          if (filtered.length === 0) apiRateLimitStore.delete(k)
          else apiRateLimitStore.set(k, filtered)
        }
        lastRateLimitSweepAt = now
      }
    }

    // Protected routes
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set("redirect", request.nextUrl.pathname)
        return NextResponse.redirect(url)
      }
    }

    // Redirect authenticated users away from auth pages
    if (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup")) {
      if (user) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Supabase middleware error:", error)
    console.warn("[v0] Allowing request through due to Supabase connectivity issues")

    // For dashboard routes, redirect to login with error message
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("error", "connection_failed")
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
