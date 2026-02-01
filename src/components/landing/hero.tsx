import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Target, BarChart3, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative container min-w-full sm:px-36 flex flex-col items-center justify-center gap-8 py-24 md:py-32 lg:py-40 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-500/10 opacity-30 blur-[120px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-blue-500/10 opacity-20 blur-[100px]"></div>
      </div>

      <div className="flex flex-col items-center gap-6 text-center z-10 animate-fade-in">
        <div className="inline-flex items-center rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-500">
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          Generative Engine Optimization
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 pb-2">
          Optimize for <span className="text-brand-500">AI-driven</span> <br className="hidden md:block" /> search & discovery
        </h1>

        <p className="max-w-3xl text-lg text-muted-foreground sm:text-xl text-balance leading-relaxed">
          Ensure your content is clearly understood, accurately interpreted, and reliably reused by generative AI. Get actionable recommendations so AI engines include your site in answers.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 z-10 mt-4 animate-slide-up">
        <Button size="lg" className="rounded-full h-12 px-8 text-base shadow-brand-500/25 shadow-lg" variant="premium" asChild>
          <Link href="/signup">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base backdrop-blur-sm bg-background/50 hover:bg-background/80" asChild>
          <Link href="#how-it-works">See how it works</Link>
        </Button>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl px-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {[
          { icon: Target, title: "Your URLs + Topics", desc: "Add your site and target questions" },
          { icon: BarChart3, title: "Scrape & Structure", desc: "H1/H2/H3, word count, signals" },
          { icon: Sparkles, title: "AI Answers", desc: "See how generative engines respond" },
          { icon: ArrowRight, title: "Recommendations", desc: "What to add or change on your site" }
        ].map((item, i) => (
          <div key={i} className="group flex flex-col items-center gap-3 p-6 border border-white/5 rounded-2xl bg-white/5 backdrop-blur-md shadow-lg transition-all hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-brand-500/10 hover:bg-white/[0.07]">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-colors">
              <item.icon className="h-6 w-6" />
            </div>
            <div className="text-lg font-bold text-foreground">{item.title}</div>
            <div className="text-sm text-muted-foreground text-center">{item.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
