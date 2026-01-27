import Link from "next/link";
import Image from "next/image";

export function Footer() {
	return (
		<footer className="border-t border-[dimgray] px-8 min-w-full bg-background">
			<div className="container  py-12 md:py-16">
				<div className="flex flex-col sm:flex-row justify-around w-full text-center gap-8">
					<div>
						<h4 className="text-sm font-semibold mb-4">Product</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="#features"
									className="text-muted-foreground hover:text-foreground transition-colors">
									Features
								</Link>
							</li>
							<li>
								<Link
									href="#pricing"
									className="text-muted-foreground hover:text-foreground transition-colors">
									Pricing
								</Link>
							</li>
							<li>
								<Link
									href="#faq"
									className="text-muted-foreground hover:text-foreground transition-colors">
									FAQ
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-sm font-semibold mb-4">Company</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="#"
									className="text-muted-foreground hover:text-foreground transition-colors">
									About
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="text-muted-foreground hover:text-foreground transition-colors">
									Blog
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="text-muted-foreground hover:text-foreground transition-colors">
									Careers
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-sm font-semibold mb-4">Legal</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									href="#"
									className="text-muted-foreground hover:text-foreground transition-colors">
									Privacy
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="text-muted-foreground hover:text-foreground transition-colors">
									Terms
								</Link>
							</li>
							<li>
								<Link
									href="#"
									className="text-muted-foreground hover:text-foreground transition-colors">
									Security
								</Link>
							</li>
						</ul>
					</div>
				</div>
				<div className="flex mt-5 flex-col">
					<div className="flex mb-3  gap-2 items-center">
						<Image className="w-8 h-8 rounded-full bg-gray-400 " src="/" alt="company-logo" width={32} height={32} />
						<h3 className="text-lg font-semibold">SaaS MVP</h3>
					</div>
					<p className="text-sm text-muted-foreground">
						The complete platform to build and scale your SaaS product.
						Built with modern tools and best practices.
					</p>
				</div>

				<div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
					<p>
						&copy; {new Date().getFullYear()} SaaS MVP. All rights
						reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
