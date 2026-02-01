import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Target, BarChart3, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="container min-w-full sm:px-36 flex flex-col items-center justify-center gap-8 py-24 md:py-32 lg:py-40">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium text-primary uppercase tracking-wider">
          Generative Engine Optimization
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
          Optimize for AI-driven search & discovery
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl text-balance">
          Ensure your content is clearly understood, accurately interpreted, and reliably reused by generative AI. Get actionable recommendations so AI engines include your site in answers.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button size="lg" >
          <Link href="/signup">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" >
          <Link href="#how-it-works">See how it works</Link>
        </Button>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4 w-full max-w-4xl">
        <div className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg bg-card">
          <Target className="h-8 w-8 text-primary mb-1" />
          <div className="text-2xl font-bold">Your URLs + topics</div>
          <div className="text-sm text-muted-foreground text-center">Add your site and target questions</div>
        </div>
        <div className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg bg-card">
          <BarChart3 className="h-8 w-8 text-primary mb-1" />
          <div className="text-2xl font-bold">Scrape & structure</div>
          <div className="text-sm text-muted-foreground text-center">H1/H2/H3, word count, competitor signals</div>
        </div>
        <div className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg bg-card">
          <Sparkles className="h-8 w-8 text-primary mb-1" />
          <div className="text-2xl font-bold">AI answers</div>
          <div className="text-sm text-muted-foreground text-center">See how generative engines respond</div>
        </div>
        <div className="flex flex-col items-center gap-2 p-6 border border-border rounded-lg bg-card">
          <ArrowRight className="h-8 w-8 text-primary mb-1" />
          <div className="text-2xl font-bold">Recommendations</div>
          <div className="text-sm text-muted-foreground text-center">What to add or change on your site</div>
        </div>
      </div>
    </section>
  )
}
