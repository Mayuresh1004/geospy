import Link from "next/link"
import { Sparkles } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background min-w-full">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-lg font-bold">
              <div className="p-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20">
                <Sparkles className="h-4 w-4 text-brand-500" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">GEOspy</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Optimize for AI-driven search and discovery. Ensure your content is clearly understood and reliably reused by generative AI engines.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#features" className="text-muted-foreground hover:text-brand-500 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-muted-foreground hover:text-brand-500 transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-muted-foreground hover:text-brand-500 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-brand-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-brand-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GEOspy. All rights reserved.</p>
          <p>Designed for the AI era.</p>
        </div>
      </div>
    </footer>
  )
}
