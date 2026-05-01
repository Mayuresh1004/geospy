# GEOspy

[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/Mayuresh1004/geospy)

GEOspy is a **Generative Engine Optimization (GEO)** platform designed to ensure your content is understood, cited, and recommended by AI-driven search engines like Perplexity and Gemini. In an era where AI synthesizes answers, traditional SEO is not enough. If your content isn't part of the AI's answer, you become invisible.

This platform moves beyond keyword tracking to reverse-engineer the "black box" of generative AI. It analyzes your content's semantic meaning, identifies critical gaps, and provides actionable, AI-powered tools to make your content the primary source for AI answers.

## ✨ Key Features

*   **Automated Agent Workflow:** A multi-step agent streams progress as it scrapes, analyzes, generates answers, and creates recommendations.
*   **Semantic Gap Analysis:** Instead of just keywords, GEOspy uses Gemini embeddings to find *meaning* gaps between your content and what AI expects to see.
*   **AI-Powered Recommendations:** Get specific, prioritized tasks to improve your GEO score, from adding missing sections to restructuring content.
*   **Content Auto-Drafting:** Instantly generate high-quality, formatted Markdown sections with a single click to fill identified content gaps.
*   **GEO Impact Simulator:** See a "before and after" of how AI will respond to your content once you implement the recommended changes, proving your ROI before you even publish.
*   **Comprehensive Dashboard:** Track your GEO score, historical performance, competitor coverage, and project progress in one place.

## 🧰 Tech Stack

*   **Framework:** Next.js 16 (App Router)
*   **AI & Agents:** Google Gemini, LangChain, LangGraph
*   **Database & Auth:** Supabase (PostgreSQL)
*   **Web Scraping:** Firecrawl
*   **UI:** shadcn/ui, Radix UI, Recharts
*   **Styling:** Tailwind CSS
*   **Language:** TypeScript
*   **Runtime:** Bun

## 🚀 Getting Started

For a complete walkthrough, see the **[Setup Guide](./SETUP_GUIDE.md)**.

### 1. Clone the repository

```bash
git clone https://github.com/mayuresh1004/geospy.git
cd geospy
```

### 2. Configure Environment Variables

Create a `.env` file in the root of the project and add the following keys. You will need API keys from Supabase, Google (for Gemini), and Firecrawl.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Generative AI & Scraping
GEMINI_API_KEY=your_gemini_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the Database

1.  Create a new project on [Supabase](https://supabase.com).
2.  Navigate to the **SQL Editor**.
3.  Copy the contents of `init.sql` and run the script to create the necessary tables and policies.

### 4. Install Dependencies & Run

```bash
bun install
bun run dev
```

Your application will be available at [http://localhost:3000](http://localhost:3000).

## 🤖 Core Workflow: The GEO Agent

The central nervous system of GEOspy is an autonomous agent built with LangGraph. When a "Full Analysis" is run, the agent executes a series of steps to provide a comprehensive GEO report.

1.  **`fetchProjectData`**: Loads the project configuration, including the target topic and associated URLs.
2.  **`scrape`**: Uses Firecrawl to scrape the content and structure of your pages and your competitors' pages. The process includes caching and retries for robustness.
3.  **`competitorAnalysis`**: Builds a "content map" of competitor sites, identifying their key content pillars, link density, and use of structured data.
4.  **`validateScrape`**: Ensures that scraping was successful before proceeding. If all scrapes fail, the run is terminated to avoid faulty analysis.
5.  **`generate`**: Queries the Gemini model with an expanded set of questions related to your target topic to simulate how a generative engine would create an answer.
6.  **`analyze`**: This is the core analysis step. It compares the AI-generated answers against your scraped content to calculate semantic coverage, identify content gaps, and compute a comprehensive GEO score.
7.  **`report`**: Based on the analysis, this node generates actionable recommendations and persists the final results and logs to the database.
