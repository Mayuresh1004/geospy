import { db } from "@/lib/db";
import type { GEOAgentState } from "@/lib/agents/types";

type CompetitorMap = GEOAgentState["competitorMap"];

export async function competitorAnalysisNode(
  state: GEOAgentState,
  config?: {
    configurable?: {
      onLog?: (line: string) => void;
      onEvent?: (evt: { step: string; log?: string; progress?: number }) => void;
    };
  }
): Promise<Partial<GEOAgentState>> {
  config?.configurable?.onLog?.("Building competitor content map...");

  const competitorUrls = state.urls.filter((u) => u.type === "competitor");
  if (!competitorUrls.length) {
    return { competitorMap: {}, logs: ["No competitor URLs to map."] };
  }

  const idToDomain = new Map<string, string>();
  for (const u of competitorUrls) {
    idToDomain.set(u.id, safeDomain(u.url) ?? u.url);
  }

  const urlIds = competitorUrls.map((u) => u.id);
  const { data: scrapedRows } = await db
    .from("scraped_content")
    .select("url_id, h2_headings, raw_content, content_structure, status")
    .in("url_id", urlIds)
    .eq("status", "success");

  const map: CompetitorMap = {};
  for (const row of scrapedRows ?? []) {
    const domain = idToDomain.get(String(row.url_id));
    if (!domain) continue;

    const h2s = Array.isArray(row.h2_headings) ? (row.h2_headings as string[]) : [];
    const top10 = h2s.slice(0, 10);

    const sectionWordCounts = extractSectionWordCounts(row.content_structure, top10);
    const contentPillars = top10.map((heading, idx) => ({
      heading,
      estimatedWordCount: sectionWordCounts[idx] ?? 0,
    }));

    const raw = String(row.raw_content ?? "");
    const externalLinksCount = countExternalLinks(raw);
    const hasSchemaMarkup = hasSchema(raw);

    if (!map[domain]) {
      map[domain] = {
        contentPillars: [],
        externalLinksCount: 0,
        hasSchemaMarkup: false,
      };
    }
    map[domain].contentPillars.push(...contentPillars);
    map[domain].externalLinksCount += externalLinksCount;
    map[domain].hasSchemaMarkup = map[domain].hasSchemaMarkup || hasSchemaMarkup;
  }

  return {
    competitorMap: map,
    logs: [
      `Competitor map built for ${Object.keys(map).length} domains.`,
    ],
  };
}

function safeDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function extractSectionWordCounts(contentStructure: unknown, headings: string[]): number[] {
  const sections =
    contentStructure &&
    typeof contentStructure === "object" &&
    Array.isArray((contentStructure as Record<string, unknown>).sections)
      ? ((contentStructure as Record<string, unknown>).sections as Array<Record<string, unknown>>)
      : [];

  if (!sections.length) return headings.map(() => 0);

  const out: number[] = [];
  for (const h of headings) {
    const match = sections.find((s) => String(s.h2 ?? "").trim() === h.trim());
    out.push(match ? Number(match.wordCount ?? 0) : 0);
  }
  return out;
}

function countExternalLinks(markdownOrText: string): number {
  const md = markdownOrText.match(/\[[^\]]+\]\((https?:\/\/[^\)\s]+)\)/g) ?? [];
  const html = markdownOrText.match(/href=["']https?:\/\/[^"']+["']/gi) ?? [];
  return md.length + html.length;
}

function hasSchema(markdownOrText: string): boolean {
  return (
    /application\/ld\+json/i.test(markdownOrText) ||
    /schema\.org/i.test(markdownOrText) ||
    /"@context"\s*:\s*"https?:\/\/schema\.org/i.test(markdownOrText)
  );
}

