import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileInput, Scissors, MessageSquare, GitCompare, Target } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"

const steps = [
  { step: 1, icon: FileInput, title: "Add your URLs & topics", description: "Create a project with your website URLs and target topics or questions." },
  { step: 2, icon: Scissors, title: "Scrape & collect signals", description: "Scrape your pages and competitors. We extract H1/H2/H3, word count, and structure." },
  { step: 3, icon: MessageSquare, title: "Generate AI answers", description: "Query a generative model with your topics. We capture and store the raw answer and metadata." },
  { step: 4, icon: GitCompare, title: "Analyze coverage", description: "We compare the AI answer to scraped content: topics present, missing, weak, and structural patterns." },
  { step: 5, icon: Target, title: "Get recommendations", description: "Actionable recommendations: what to add or change on your site so AI can better reuse your content." },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="container min-w-full sm:px-36 py-24 md:py-32 bg-muted/30"
    >
      <div className="flex flex-col items-center gap-4 text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
          How it works
        </h2>
        <p className="max-w-2xl text-lg text-muted-foreground text-balance">
          Five steps from your URLs to actionable GEO recommendations.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {steps.slice(0, 3).map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.step} className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mt-2">{item.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-3xl mx-auto mt-6">
        {steps.slice(3).map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.step} className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mt-2">{item.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-center mt-12">
        <Button size="lg" asChild>
          <Link href="/signup">
            Get started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
