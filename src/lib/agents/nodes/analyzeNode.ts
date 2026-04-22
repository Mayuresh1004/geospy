import { db } from "@/lib/db";
import type { GEOAgentState } from "@/lib/agents/types";
import { analyzeProject } from "@/lib/analysis/analyzeProject";
import { computeGEOScoreBreakdown } from "@/lib/scoring/geoScore";

export async function analyzeNode(
  state: GEOAgentState,
  config?: {
    configurable?: {
      onLog?: (line: string) => void;
      onEvent?: (evt: { step: string; log?: string; progress?: number }) => void;
    };
  }
): Promise<Partial<GEOAgentState>> {
  config?.configurable?.onLog?.("Running semantic analysis...");
  config?.configurable?.onEvent?.({
    step: "analyzing",
    log: "Running semantic analysis...",
    progress: 80,
  });

  const bestAnswer = await pickBestAnswerBySemanticCoverage(state.projectId);
  if (!bestAnswer) {
    throw new Error("No AI answers found to analyze");
  }

  const { analysis, recommendationSummaries } = await analyzeProject({
    projectId: state.projectId,
    userId: state.userId,
    aiAnswerId: bestAnswer.id,
    competitorMap: state.competitorMap,
  });

  const citationScore = await computeCitationScore({
    projectId: state.projectId,
    rawAnswer: bestAnswer.raw_answer,
  });

  const geoBreakdown = await computeAndPersistGeoScore({
    projectId: state.projectId,
    analysisId: String(analysis.id),
    rawAnswer: bestAnswer.raw_answer,
    semanticCoveragePct: Number(analysis.competitor_coverage?.semantic_coverage ?? 0),
  });

  // Persist citationScore into analysis_results if column exists; ignore if not.
  await db
    .from("analysis_results")
    .update({
      competitor_coverage: {
        ...(analysis.competitor_coverage ?? {}),
        citation_score: citationScore,
      },
    })
    .eq("id", analysis.id);

  return {
    currentStep: "analyzing",
    analysisResult: {
      id: String(analysis.id),
      depthScore: Number(analysis.content_depth_score ?? 0),
      semanticCoverage: Number(analysis.competitor_coverage?.semantic_coverage ?? 0),
    },
    recommendations: recommendationSummaries,
    logs: [
      `Analysis complete. GEO depth=${analysis.content_depth_score}, semantic=${analysis.competitor_coverage?.semantic_coverage ?? 0}, citationScore=${citationScore}, totalScore=${geoBreakdown?.total ?? 0}.`,
    ],
  };
}

async function computeAndPersistGeoScore(input: {
  projectId: string;
  analysisId: string;
  rawAnswer: string;
  semanticCoveragePct: number;
}): Promise<{ total: number } | null> {
  try {
    const { data: urls } = await db
      .from("urls")
      .select("id, type")
      .eq("project_id", input.projectId);

    const targetIds = (urls ?? []).filter((u) => u.type === "target").map((u) => u.id);
    const competitorIds = (urls ?? []).filter((u) => u.type === "competitor").map((u) => u.id);

    const [{ data: targetScrapes }, { data: competitorScrapes }] = await Promise.all([
      db
        .from("scraped_content")
        .select("raw_content, word_count, h2_headings, h3_headings")
        .in("url_id", targetIds)
        .eq("status", "success"),
      competitorIds.length
        ? db
            .from("scraped_content")
            .select("word_count")
            .in("url_id", competitorIds)
            .eq("status", "success")
        : Promise.resolve({ data: [] as Array<{ word_count: number | null }> }),
    ]);

    const targetWordCount = (targetScrapes ?? []).reduce(
      (sum, r) => sum + Number(r.word_count ?? 0),
      0
    );
    const competitorWordCounts = (competitorScrapes ?? []).map((r) =>
      Number(r.word_count ?? 0)
    );
    const competitorAvgWordCount =
      competitorWordCounts.length > 0
        ? competitorWordCounts.reduce((a, b) => a + b, 0) / competitorWordCounts.length
        : 0;

    const targetText = (targetScrapes ?? [])
      .map((r) => String(r.raw_content ?? ""))
      .join("\n\n")
      .slice(0, 100_000);

    const h2s = (targetScrapes ?? []).flatMap((r) =>
      Array.isArray(r.h2_headings) ? (r.h2_headings as string[]) : []
    );
    const h3s = (targetScrapes ?? []).flatMap((r) =>
      Array.isArray(r.h3_headings) ? (r.h3_headings as string[]) : []
    );

    const breakdown = computeGEOScoreBreakdown({
      targetWordCount,
      competitorAvgWordCount,
      semanticCoveragePct: input.semanticCoveragePct,
      targetMarkdownOrText: targetText,
      rawAnswer: input.rawAnswer,
      targetHeadings: { h2: h2s, h3: h3s },
    });

    await db
      .from("analysis_results")
      .update({ geo_score_breakdown: breakdown })
      .eq("id", input.analysisId);

    return { total: breakdown.total };
  } catch {
    return null;
  }
}

async function pickBestAnswerBySemanticCoverage(projectId: string): Promise<
  | { id: string; raw_answer: string; key_concepts: string[] }
  | null
> {
  const competitorTopics = await loadCompetitorTopics(projectId);
  const { data, error } = await db
    .from("ai_answers")
    .select("id, raw_answer, key_concepts")
    .eq("project_id", projectId);
  if (error) throw error;
  const answers = (data ?? []).map((a) => ({
    id: String(a.id),
    raw_answer: String(a.raw_answer ?? ""),
    key_concepts: Array.isArray(a.key_concepts) ? (a.key_concepts as string[]) : [],
  }));
  if (!answers.length) return null;

  let best = answers[0];
  let bestScore = scoreCoverage(best.key_concepts, competitorTopics);
  for (const a of answers.slice(1)) {
    const score = scoreCoverage(a.key_concepts, competitorTopics);
    if (score > bestScore) {
      best = a;
      bestScore = score;
    } else if (score === bestScore && a.raw_answer.length > best.raw_answer.length) {
      best = a;
    }
  }
  return best;
}

async function loadCompetitorTopics(projectId: string): Promise<string[]> {
  const { data: urls } = await db
    .from("urls")
    .select("id, type")
    .eq("project_id", projectId)
    .eq("type", "competitor");
  const ids = (urls ?? []).map((u) => u.id);
  if (!ids.length) return [];

  const { data: scraped } = await db
    .from("scraped_content")
    .select("h2_headings, h3_headings")
    .in("url_id", ids)
    .eq("status", "success");

  const topics = new Set<string>();
  for (const row of scraped ?? []) {
    const h2s = Array.isArray(row.h2_headings) ? row.h2_headings : [];
    const h3s = Array.isArray(row.h3_headings) ? row.h3_headings : [];
    for (const t of [...h2s, ...h3s]) {
      if (typeof t === "string" && t.trim().length > 2) topics.add(normalize(t));
    }
  }
  return Array.from(topics);
}

function scoreCoverage(keyConcepts: string[], competitorTopics: string[]): number {
  const ks = keyConcepts.map(normalize).filter(Boolean);
  if (!ks.length || !competitorTopics.length) return 0;
  const set = new Set(competitorTopics);
  const covered = ks.filter((k) => set.has(k)).length;
  return Math.round((covered / ks.length) * 100);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

async function computeCitationScore(input: {
  projectId: string;
  rawAnswer: string;
}): Promise<number> {
  const { data: urls } = await db
    .from("urls")
    .select("url, type")
    .eq("project_id", input.projectId)
    .eq("type", "competitor");

  const competitorDomains = (urls ?? [])
    .map((u) => safeDomain(String(u.url ?? "")))
    .filter(Boolean) as string[];

  const unique = Array.from(new Set(competitorDomains));
  if (unique.length === 0) return 0;

  const lower = input.rawAnswer.toLowerCase();
  const mentions = unique.filter((d) => lower.includes(d.toLowerCase())).length;
  return Math.round((mentions / unique.length) * 100);
}

function safeDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

