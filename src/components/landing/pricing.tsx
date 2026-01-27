import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

// ✨ REUSABILITY: The data structure is enhanced to be more declarative.
// - `priceSuffix` allows for different billing periods (e.g., /month, /year).
// - `variant` for the button is now part of the data, removing logic from JSX.
const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    priceSuffix: "/month",
    description: "Perfect for side projects and small teams.",
    features: [
      "Up to 5 team members",
      "10GB storage",
      "Basic analytics",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
    variant: "outline",
    href: "/contact-sales",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    priceSuffix: "/month",
    description: "For growing businesses that need more power.",
    features: [
      "Up to 20 team members",
      "100GB storage",
      "Advanced analytics",
      "Priority email support",
      "API access",
    ],
    cta: "Start 14-day Trial",
    popular: true,
    variant: "default",
    href: "/contact-sales",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceSuffix: "", // No suffix for custom pricing
    description: "For large organizations with specific needs.",
    features: [
      "Unlimited team members",
      "Unlimited storage",
      "Dedicated support & SLA",
      "Advanced security & SSO",
    ],
    cta: "Contact Sales",
    popular: false,
    variant: "outline",
    href: "/contact-sales",
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="container  min-w-full sm:px-36 py-24 sm:py-32"
    >
      <div className="flex flex-col items-center gap-4 text-center mb-16">
        {/* ✨ POLISH: Added a subtle gradient to the main headline for a modern feel */}
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-linear-to-b from-primary/60 to-primary text-transparent bg-clip-text pb-2">
          Simple, Transparent Pricing
        </h2>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Choose the plan that&apos;s right for you. No hidden fees, ever.
        </p>
      </div>

      {/* ✨ LAYOUT: Improved responsiveness with md:grid-cols-2 for tablets */}
      <div className="flex justify-center flex-wrap gap-5 flex-col mx-2 sm:flex-row">
        {plans.map((plan) => (
          // ✨ LAYOUT: Using flexbox to ensure cards have equal height and footers are aligned.
          <Card
            key={plan.id}
            className={`flex min-w-[18em] sm:min-w-[25em] min-h-[35em] px-8 flex-col transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 ${
              plan.popular
                ? "border-primary border-2 shadow-primary/20"
                : "border border-[darkgray]"
            }`}
          >
            {/* The popular badge can be part of the Card, not a separate div */}
            <CardHeader className="relative">
              {plan.popular && (
                <div
                  style={{
                    top: "-0.8em",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                  }}
                  className="absolute top-0 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold rounded-full shadow-md"
                >
                  Most Popular
                </div>
              )}
              <CardTitle
                style={{ fontSize: "xx-large" }}
                className="pt-6 text-center"
              >
                {plan.name}
              </CardTitle>
              <div className="flex justify-center items-baseline gap-2 mt-4">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                {plan.priceSuffix && (
                  <span className="text-muted-foreground">
                    {plan.priceSuffix}
                  </span>
                )}
              </div>
              <CardDescription className="text-center">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="grow">
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            {/* <CardFooter>
							{plan.id === "enterprise" ? (
							<Button
								className={`w-full text-white ${plan.id === "enterprise" ? " bg-white" : "bg-black"}`}
								asChild>
								<Link
									className={`${plan.id === "enterprise" ? "text-black" : "text-white"}`}
									href="/contact-sales">
									{plan.cta}
								</Link>
							</Button>
							) : (
                // ✨ REUSABILITY: Pass the variant to the CheckoutButton
                <Button planId={plan.id} variant={plan.variant}>
                  <Link href={"/contact-sales"}>{plan.cta}</Link>
                </Button>
              )}
						</CardFooter> */}
            <CardFooter>
              {plan.id === "pro" ? (
                <Button className="w-full" variant="default" asChild>
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              ) : (
                <Button className="w-full" variant="outline" asChild>
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
