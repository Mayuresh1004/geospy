import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// ✨ BEST PRACTICE: Added a unique `id` for more stable React keys instead of using the array index.
const faqs = [
  {
    id: "faq-1",
    question: "What is included in the free trial?",
    answer:
      "Our 14-day free trial includes full access to all features of your chosen plan. No credit card is required to get started, and you can explore everything our platform has to offer.",
  },
  {
    id: "faq-2",
    question: "Can I change my plan later?",
    answer:
      "Absolutely. You can easily upgrade or downgrade your plan at any time from your account dashboard. Prorated charges or credits will be applied automatically.",
  },
  {
    id: "faq-3",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and process all payments securely through Stripe and Razorpay.",
  },
  {
    id: "faq-4",
    question: "Is my data secure?",
    answer:
      "Yes, data security is our top priority. We use enterprise-grade security with 256-bit SSL encryption for all data in transit and at rest. Our infrastructure is hosted on secure, compliant cloud services.",
  },
  {
    id: "faq-5",
    question: "Do you offer refunds?",
    answer:
      "We stand by our product with a 30-day money-back guarantee. If you are not satisfied for any reason within the first 30 days, contact our support team for a full, no-questions-asked refund.",
  },
  {
    id: "faq-6",
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel your subscription at any time with a single click from your billing settings. You will retain full access to your plan's features until the end of your current billing period.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="px-8 py-24 sm:py-32">
      <div className="flex gap-12 flex-col sm:flex-row">
        <div className="flex items-center sm:items-start sm:max-w-[40%] flex-col gap-4 text-left">
          {/* ✨ POLISH: Added a smaller "eyebrow" text for visual hierarchy */}
          <p className="font-medium text-primary">Got Questions?</p>
          <h2 className="text-4xl text-center sm:text-start font-bold tracking-tight sm:text-5xl text-balance">
            Frequently Asked Questions
          </h2>
          <p className="max-w-xl text-center sm:text-start text-lg text-muted-foreground text-balance">
            Can&apos;t find the answer you&apos;re looking for? Reach out to our friendly support team. We&apos;re here to help!
          </p>

          {/* ✨ UI: Added a clear call-to-action button */}
          <div className="mt-4">
            <Button asChild>
              <Link href="/contact-support">Contact Support</Link>
            </Button>
          </div>
        </div>

        <div className="lg:pt-12 w-full">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                {/* ✨ POLISH: Increased font size and weight for better readability */}
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                {/* ✨ POLISH: Added more padding and slightly larger text for the answer */}
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