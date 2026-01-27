import { Zap, Shield, Rocket, Users, BarChart, CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built with performance in mind. Experience blazing fast load times and smooth interactions.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Enterprise-grade security with row-level security, authentication, and data encryption.",
  },
  {
    icon: Rocket,
    title: "Deploy in Minutes",
    description: "Go from idea to production in minutes. No complex configuration or setup required.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Built-in tools for your team to collaborate, share feedback, and iterate faster.",
  },
  {
    icon: BarChart,
    title: "Analytics & Insights",
    description: "Track user behavior, monitor performance, and make data-driven decisions.",
  },
  {
    icon: CreditCard,
    title: "Payment Ready",
    description: "Integrated payment processing with Stripe and Razorpay. Start monetizing immediately.",
  },
]

export function Features() {
  return (
		<section
			id="features"
			className="container  min-w-full sm:px-36 py-24 md:py-32">
			<div className="flex flex-col items-center gap-4 text-center mb-16">
				<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
					Everything you need to launch
				</h2>
				<p className="max-w-2xl text-lg text-muted-foreground text-balance">
					A complete toolkit with authentication, payments, database, and
					more. Focus on building your product, not the infrastructure.
				</p>
			</div>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{features.map((feature) => (
					<Card key={feature.title} className="border-border/50">
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
	);
}
