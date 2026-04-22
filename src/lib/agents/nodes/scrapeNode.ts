import pLimit from "p-limit";
import { db } from "@/lib/db";
import type { GEOAgentState } from "@/lib/agents/types";

const CONCURRENCY = 3;
const PER_URL_TIMEOUT_MS = 30_000;
const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v0/scrape";

export async function scrapeNode(
  state: GEOAgentState,
  config?: {
    configurable?: {
      onLog?: (line: string) => void;
      onEvent?: (evt: { step: string; log?: string; progress?: number }) => void;
    };
  }
): Promise<Partial<GEOAgentState>> {
  const apiKey = process.env.FIRECRAWL_API_KEY ?? "";
  const limit = pLimit(CONCURRENCY);

  config?.configurable?.onLog?.(`Scraping ${state.urls.length} URLs...`);
  config?.configurable?.onEvent?.({
    step: "scraping",
    log: `Scraping ${state.urls.length} URLs...`,
    progress: 20,
  });

  const results = await Promise.all(
    state.urls.map((u) =>
      limit(async () => {
        const r = await scrapeOneUrl(u, apiKey);
        if (r.status === "failed") {
          config?.configurable?.onLog?.(`Failed scrape: ${u.url} (${r.error})`);
        } else if ("from_cache" in r && r.from_cache) {
          config?.configurable?.onLog?.(
            `Cache hit: ${u.url} (${r.word_count} words, <=7 days old)`
          );
        } else {
          config?.configurable?.onLog?.(
            `Scraped: ${u.url} (${r.word_count} words)`
          );
        }
        return r;
      })
    )
  );

  const scrapeResults = results.map((r) => ({
    urlId: r.url_id,
    status: r.status,
    wordCount: r.word_count,
  }));

  const errors = results
    .filter((r) => r.status === "failed")
    .map((r) => `Scrape failed for ${r.url}: ${"error" in r ? r.error : ""}`);

  return {
    currentStep: "scraping",
    scrapeResults,
    errors: errors.length ? errors : [],
    logs: [
      `Scrape complete: ${scrapeResults.filter((x) => x.status === "success").length}/${scrapeResults.length} succeeded.`,
    ],
  };
}

export type ScrapeResultRow =
  | {
      url_id: string;
      url: string;
      status: "success";
      word_count: number;
      from_cache?: boolean;
    }
  | {
      url_id: string;
      url: string;
      status: "failed";
      word_count: 0;
      error: string;
    };

async function scrapeOneUrl(
  urlRow: { id: string; url: string },
  firecrawlApiKey: string
): Promise<ScrapeResultRow> {
  const cached = await getRecentSuccessfulScrape(urlRow.id);
  if (cached) {
    return {
      url_id: urlRow.id,
      url: urlRow.url,
      status: "success",
      word_count: cached.word_count,
      from_cache: true,
    };
  }

  // Attempt Firecrawl if available; otherwise fall back to basic fetch+parse.
  const result = firecrawlApiKey
    ? await tryFirecrawl(urlRow, firecrawlApiKey).catch((e) => ({
        ok: false as const,
        error: e instanceof Error ? e.message : "Unknown error",
      }))
    : ({ ok: false as const, error: "FIRECRAWL_API_KEY not set" } as const);

  if (result.ok) {
    const structure = extractStructureFromMarkdown(result.markdown);
    await insertScrapedContent({
      urlId: urlRow.id,
      status: "success",
      h1s: structure.h1s,
      h2s: structure.h2s,
      h3s: structure.h3s,
      wordCount: structure.wordCount,
      contentStructure: structure.fullStructure,
      rawContent: result.markdown,
    });

    return {
      url_id: urlRow.id,
      url: urlRow.url,
      status: "success",
      word_count: structure.wordCount,
    };
  }

  // Fallback scrape
  try {
    const fallback = await basicFetchAndParse(urlRow.url);
    await insertScrapedContent({
      urlId: urlRow.id,
      status: "success",
      h1s: fallback.h1s,
      h2s: fallback.h2s,
      h3s: fallback.h3s,
      wordCount: fallback.wordCount,
      contentStructure: fallback.fullStructure,
      rawContent: fallback.rawText,
    });
    return {
      url_id: urlRow.id,
      url: urlRow.url,
      status: "success",
      word_count: fallback.wordCount,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    await insertScrapedContent({
      urlId: urlRow.id,
      status: "failed",
      h1s: [],
      h2s: [],
      h3s: [],
      wordCount: 0,
      contentStructure: {},
      rawContent: null,
    }).catch(() => {});

    return {
      url_id: urlRow.id,
      url: urlRow.url,
      status: "failed",
      word_count: 0,
      error: `Firecrawl failed (${result.error}); fallback failed (${message})`,
    };
  }
}

async function getRecentSuccessfulScrape(
  urlId: string
): Promise<{ word_count: number } | null> {
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db
    .from("scraped_content")
    .select("word_count, created_at, scraped_at")
    .eq("url_id", urlId)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const timestamp = String((data as Record<string, unknown>).created_at ?? (data as Record<string, unknown>).scraped_at ?? "");
  if (!timestamp) return null;
  if (new Date(timestamp).toISOString() < sevenDaysAgoIso) return null;

  return { word_count: Number((data as Record<string, unknown>).word_count ?? 0) };
}

async function tryFirecrawl(
  urlRow: { id: string; url: string },
  apiKey: string
): Promise<{ ok: true; markdown: string } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PER_URL_TIMEOUT_MS);

  try {
    const response = await fetch(FIRECRAWL_SCRAPE_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: urlRow.url, formats: ["markdown"] }),
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        error: `Firecrawl API error: ${response.statusText} - ${errorText}`,
      };
    }

    const data = await response.json();
    const markdown = data?.data?.markdown;
    if (!markdown || typeof markdown !== "string") {
      return { ok: false, error: "No markdown content returned from Firecrawl" };
    }

    return { ok: true, markdown };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

async function basicFetchAndParse(url: string): Promise<{
  rawText: string;
  h1s: string[];
  h2s: string[];
  h3s: string[];
  wordCount: number;
  fullStructure: { sections: { h2: string; h3s: string[]; wordCount: number }[] };
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PER_URL_TIMEOUT_MS);
  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      // Basic UA improves chances some sites respond with HTML
      "User-Agent":
        "Mozilla/5.0 (compatible; GEOspyBot/1.0; +https://geospy.local)",
      Accept: "text/html,application/xhtml+xml",
    },
  }).finally(() => clearTimeout(timeout));

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const cleaned = stripScriptsAndStyles(html);

  const h1s = extractTagText(cleaned, "h1");
  const h2s = extractTagText(cleaned, "h2");
  const h3s = extractTagText(cleaned, "h3");

  const rawText = htmlToText(cleaned).slice(0, 50_000);
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  const fullStructure = buildHierarchyFromH2s(rawText, h2s);

  return { rawText, h1s, h2s, h3s, wordCount, fullStructure };
}

function stripScriptsAndStyles(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

function extractTagText(html: string, tag: "h1" | "h2" | "h3"): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null = null;
  while ((m = re.exec(html))) {
    const text = htmlToText(m[1]).trim();
    if (text) out.push(text.slice(0, 200));
  }
  return out.slice(0, 50);
}

function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|br)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractStructureFromMarkdown(markdown: string) {
  const h1Regex = /^# (.+)$/gm;
  const h2Regex = /^## (.+)$/gm;
  const h3Regex = /^### (.+)$/gm;

  const h1s: string[] = [];
  const h2s: string[] = [];
  const h3s: string[] = [];
  let match;
  while ((match = h1Regex.exec(markdown))) h1s.push(match[1].trim());
  while ((match = h2Regex.exec(markdown))) h2s.push(match[1].trim());
  while ((match = h3Regex.exec(markdown))) h3s.push(match[1].trim());

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;

  return {
    h1s,
    h2s,
    h3s,
    wordCount,
    fullStructure: buildHierarchyFromH2s(markdown, h2s),
  };
}

function buildHierarchyFromH2s(rawText: string, h2s: string[]) {
  const sections: { h2: string; h3s: string[]; wordCount: number }[] = [];
  const splits = rawText.split(/\n##\s.+\n/gm);

  h2s.forEach((title, index) => {
    const content = splits[index + 1] ?? "";
    const h3s: string[] = [];
    const h3Regex = /^### (.+)$/gm;
    let match;
    while ((match = h3Regex.exec(content))) h3s.push(match[1].trim());
    sections.push({
      h2: title,
      h3s,
      wordCount: content.split(/\s+/).filter(Boolean).length,
    });
  });

  return { sections };
}

async function insertScrapedContent(input: {
  urlId: string;
  status: "success" | "failed";
  h1s: string[];
  h2s: string[];
  h3s: string[];
  wordCount: number;
  contentStructure: unknown;
  rawContent: string | null;
}) {
  const payload: Record<string, unknown> = {
    url_id: input.urlId,
    status: input.status,
    h1_headings: input.h1s,
    h2_headings: input.h2s,
    h3_headings: input.h3s,
    word_count: input.wordCount,
    content_structure: input.contentStructure ?? {},
  };
  if (input.rawContent) payload.raw_content = input.rawContent.slice(0, 50_000);

  const { error } = await db.from("scraped_content").insert(payload);
  if (error) throw error;
}

