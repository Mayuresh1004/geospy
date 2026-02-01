import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import pLimit from "p-limit";
const CONCURRENCY = 3;
const PER_URL_TIMEOUT_MS = 30_000;
const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v0/scrape";


interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteProps) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "FIRECRAWL_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const user = await requireAuth();
    const { id: projectId } = await params;

    if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }


    const { data: project, error: projectError } = await db
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError) throw projectError;
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const { data: urls } = await db.from("urls").select("*").eq("project_id", projectId);
    if (!urls || urls.length === 0) {
      return NextResponse.json(
        { error: "No URLs found for this project" },
        { status: 400 }
      );
    }

    const limit = pLimit(CONCURRENCY);
    const results = await Promise.all(
      urls.map((url) => limit(() => scrapeOneUrl(url, apiKey)))
    );

    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      success: true,
      results,
      summary: { total: urls.length, succeeded: successCount, failed: failedCount },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to scrape content" },
      { status: 500 }
    );
  }
}

async function scrapeOneUrl(
  urlRow: { id: string; url: string },
  apiKey: string
): Promise<
  | { url: string; status: "success"; data: { id: string; h1_count: number; h2_count: number; h3_count: number; word_count: number } }
  | { url: string; status: "failed"; error: string }
> {
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
      throw new Error(`Firecrawl API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data?.data?.markdown) {
      throw new Error("No markdown content returned from Firecrawl");
    }

    const structure = extractStructure(data.data.markdown);

    const { data: scrapedContent, error: insertError } = await db
      .from("scraped_content")
      .insert({
        url_id: urlRow.id,
        h1_headings: structure.h1s,
        h2_headings: structure.h2s,
        h3_headings: structure.h3s,
        word_count: structure.wordCount,
        content_structure: structure.fullStructure,
        raw_content: data.data.markdown.slice(0, 50_000),
        status: "success",
      })
      .select()
      .single();

    if (insertError) throw insertError;
    if (!scrapedContent) throw new Error("Insert returned no data");

    return {
      url: urlRow.url,
      status: "success",
      data: {
        id: scrapedContent.id,
        h1_count: structure.h1s.length,
        h2_count: structure.h2s.length,
        h3_count: structure.h3s.length,
        word_count: structure.wordCount,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await db.from("scraped_content").insert({
      url_id: urlRow.id,
      status: "failed",
      h1_headings: [],
      h2_headings: [],
      h3_headings: [],
      word_count: 0,
      content_structure: {},
    });

    return {
      url: urlRow.url,
      status: "failed",
      error: message,
    };
  }
}

function extractStructure(markdown: string) {
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
    fullStructure: buildHierarchy(markdown, h2s),
  };
}

function buildHierarchy(markdown: string, h2s: string[]) {
  const sections: { h2: string; h3s: string[]; wordCount: number }[] = [];
  const splits = markdown.split(/^## .+$/gm);

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
