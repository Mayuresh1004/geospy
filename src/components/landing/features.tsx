import {
  Globe,
  Scissors,
  MessageSquare,
  Eye,
  GitCompare,
  Target,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"

const features = [
  {
    icon: Globe,
    title: "Input & setup",
    description:
      "Add your website domain or URLs and one or more target topics or questions. The platform uses your URLs and topics as the basis for scraping, AI answers, and recommendations.",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: Scissors,
    title: "Content & competitor signals",
    description:
      "Scrape competitor or reference pages and extract structural signals: H1/H2/H3 headings, word count, and content structure. Stored for comparison so you can see how your content stacks up.",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    icon: MessageSquare,
    title: "GEO answer generation",
    description:
      "Query a generative model with your target topics or questions. Capture and store the raw AI-generated answer, query, timestamp, and metadata—simulating how modern generative engines respond to user intent.",
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    icon: Eye,
    title: "Insights screen",
    description:
      "A read-only insights view showing the AI-generated answer, key concepts and entities, and answer format (paragraph, bullet list, step-by-step, or definition). Understand how a generative engine currently explains your topic.",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    icon: GitCompare,
    title: "Analysis layer",
    description:
      "Analyze the AI answer against scraped competitor content and structural depth. Identify topics included, missing, or weakly represented, and structural patterns preferred by the generative engine.",
    color: "text-pink-500",
    bg: "bg-pink-500/10"
  },
  {
    icon: Target,
    title: "Optimization recommendations",
    description:
      "Clearly presented recommendations: missing sections or concepts, recommended formats (FAQ, steps, glossary, definitions), and structural improvements (clear headings, concise summaries). Each answers: what to add or modify on your site so AI can better reuse your content.",
    color: "text-brand-500",
    bg: "bg-brand-500/10"
  },
]

export function Features() {
  return (
    <section
      id="features"
      className="container min-w-full sm:px-36 py-24 md:py-32 relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-0 -z-10 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[100px] -translate-y-1/2"></div>

      <div className="flex flex-col items-center gap-4 text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
          Everything you need for GEO
        </h2>
        <p className="max-w-2xl text-lg text-muted-foreground text-balance">
          From URLs and topics to AI answers and actionable recommendations—all in one platform.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-1">
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${feature.bg} ${feature.color} group-hover:bg-brand-500 group-hover:text-white`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl group-hover:text-brand-500 transition-colors">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
