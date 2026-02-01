import type React from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GEOspy - Generative Engine Optimization Platform",
  description:
    "Optimize your content for the AI era. Ensure your site is understood, cited, and recommended by generative engines like ChatGPT, Gemini, and Perplexity.",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-background text-foreground">
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
