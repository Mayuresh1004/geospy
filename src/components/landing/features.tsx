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
  },
  {
    icon: Scissors,
    title: "Content & competitor signals",
    description:
      "Scrape competitor or reference pages and extract structural signals: H1/H2/H3 headings, word count, and content structure. Stored for comparison so you can see how your content stacks up.",
  },
  {
    icon: MessageSquare,
    title: "GEO answer generation",
    description:
      "Query a generative model with your target topics or questions. Capture and store the raw AI-generated answer, query, timestamp, and metadata—simulating how modern generative engines respond to user intent.",
  },
  {
    icon: Eye,
    title: "Insights screen",
    description:
      "A read-only insights view showing the AI-generated answer, key concepts and entities, and answer format (paragraph, bullet list, step-by-step, or definition). Understand how a generative engine currently explains your topic.",
  },
  {
    icon: GitCompare,
    title: "Analysis layer",
    description:
      "Analyze the AI answer against scraped competitor content and structural depth. Identify topics included, missing, or weakly represented, and structural patterns preferred by the generative engine.",
  },
  {
    icon: Target,
    title: "Optimization recommendations",
    description:
      "Clearly presented recommendations: missing sections or concepts, recommended formats (FAQ, steps, glossary, definitions), and structural improvements (clear headings, concise summaries). Each answers: what to add or modify on your site so AI can better reuse your content.",
  },
]

export function Features() {
  return (
    <section
      id="features"
      className="container min-w-full sm:px-36 py-24 md:py-32"
    >
      <div className="flex flex-col items-center gap-4 text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
          Everything you need for GEO
        </h2>
        <p className="max-w-2xl text-lg text-muted-foreground text-balance">
          From URLs and topics to AI answers and actionable recommendations—all in one platform.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border/80 hover:shadow-sm hover:-translate-y-1">
            <CardHeader>
              <feature.icon className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
