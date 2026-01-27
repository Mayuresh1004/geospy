import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="container min-w-full sm:px-36 flex flex-col items-center justify-center gap-8 py-24 md:py-32 lg:py-40">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
          The complete platform to build your SaaS
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl text-balance">
          Your team&apos;s toolkit to stop configuring and start innovating. Securely build, deploy, and scale the best web
          experiences with modern tools.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button size="lg" asChild>
          <Link href="/signup">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="#features">Explore Features</Link>
        </Button>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 w-full max-w-4xl">
        <div className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg">
          <div className="text-3xl font-bold">20 days</div>
          <div className="text-sm text-muted-foreground text-center">saved on daily builds</div>
        </div>
        <div className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg">
          <div className="text-3xl font-bold">98%</div>
          <div className="text-sm text-muted-foreground text-center">faster time to market</div>
        </div>
        <div className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg">
          <div className="text-3xl font-bold">300%</div>
          <div className="text-sm text-muted-foreground text-center">increase in productivity</div>
        </div>
        <div className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg">
          <div className="text-3xl font-bold">6x</div>
          <div className="text-sm text-muted-foreground text-center">faster to build + deploy</div>
        </div>
      </div>
    </section>
  )
}
