import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const faqs = [
  {
    id: "faq-1",
    question: "What is Generative Engine Optimization (GEO)?",
    answer:
      "GEO is an optimization approach focused on ensuring your content is clearly understood, accurately interpreted, and reliably reused by generative AI systems (e.g. ChatGPT, Perplexity, Gemini). Unlike traditional SEO, GEO prioritizes semantic clarity, structural organization, and content completeness so AI engines include and cite your content in synthesized answers.",
  },
  {
    id: "faq-2",
    question: "What do I need to get started?",
    answer:
      "You need your website domain or a set of URLs (your pages and optionally competitor pages), and one or more target topics or questions you care about. After signing up, create a project, add your URLs and topics, then run scraping and AI answer generation. The platform will analyze and produce recommendations.",
  },
  {
    id: "faq-3",
    question: "How are recommendations generated?",
    answer:
      "We compare the AI-generated answer for your topic against your scraped content and competitor content. We identify topics that are present, missing, or weakly represented, and analyze structural patterns (e.g. bullet lists, definitions, step-by-step). Recommendations tell you what to add or modify on your site—such as missing sections, FAQ blocks, glossary, or clearer headings—so generative AI can better understand and reuse your content.",
  },
  {
    id: "faq-4",
    question: "What is the Insights screen?",
    answer:
      "The Insights screen shows how a generative engine currently explains your topic: the raw AI-generated answer, key concepts and entities we detected, and the answer format (paragraph, bullet list, step-by-step, or definition). It helps you understand what AI is already surfacing before you optimize.",
  },
  {
    id: "faq-5",
    question: "Do you crawl or store my full page content?",
    answer:
      "We scrape the pages you add (your URLs and competitor URLs) to extract structural signals: H1/H2/H3 headings, word count, and content structure. We focus on structure and coverage for comparison, not large-scale crawling. Raw content is stored in a limited form for analysis. Check our privacy and terms for full details.",
  },
  {
    id: "faq-6",
    question: "How do I use the recommendations?",
    answer:
      "Each recommendation answers: “What should be added to or modified on my website so generative AI can better understand and reuse my content?” You’ll see missing sections or concepts, suggested formats (FAQ, steps, glossary, definitions), and structural improvements (clear headings, concise summaries). Implement these on your site to improve GEO performance.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="px-8 py-24 sm:py-32 container">
      <div className="flex gap-12 flex-col sm:flex-row">
        <div className="flex items-center sm:items-start sm:max-w-[40%] flex-col gap-4 text-left">
          <p className="font-medium text-primary">Got questions?</p>
          <h2 className="text-4xl text-center sm:text-start font-bold tracking-tight sm:text-5xl text-balance">
            Frequently Asked Questions
          </h2>
          <p className="max-w-xl text-center sm:text-start text-lg text-muted-foreground text-balance">
            Can&apos;t find the answer? Sign up and start a project—you can add your URLs and topics and see results in minutes.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>

        <div className="lg:pt-12 w-full">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
