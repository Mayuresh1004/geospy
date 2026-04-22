export interface GEOScoreBreakdown {
  contentDepth: number; // 0-25
  semanticCoverage: number; // 0-25
  structuralClarity: number; // 0-25
  citationPotential: number; // 0-25
  total: number; // 0-100
}

export function computeGEOScoreBreakdown(input: {
  targetWordCount: number;
  competitorAvgWordCount: number;
  semanticCoveragePct: number; // 0-100
  targetMarkdownOrText: string;
  rawAnswer: string;
  targetHeadings?: { h2: string[]; h3: string[] };
}): GEOScoreBreakdown {
  const contentDepth = clamp25(
    computeContentDepthScore(input.targetWordCount, input.competitorAvgWordCount)
  );

  const semanticCoverage = clamp25(
    Math.round((clampPct(input.semanticCoveragePct) / 100) * 25)
  );

  const structuralClarity = clamp25(
    computeStructuralClarity({
      markdownOrText: input.targetMarkdownOrText,
      h2s: input.targetHeadings?.h2 ?? [],
    })
  );

  const citationPotential = clamp25(
    computeCitationPotential(input.rawAnswer, input.targetMarkdownOrText)
  );

  const total = clamp100(
    contentDepth + semanticCoverage + structuralClarity + citationPotential
  );

  return { contentDepth, semanticCoverage, structuralClarity, citationPotential, total };
}

function computeContentDepthScore(targetWords: number, competitorAvgWords: number): number {
  if (targetWords <= 0) return 0;
  if (competitorAvgWords <= 0) {
    // If no competitor baseline, give partial credit for reaching ~1200 words.
    return Math.round(Math.min(25, (targetWords / 1200) * 25));
  }
  const ratio = targetWords / competitorAvgWords;
  // 1.0x competitors => ~18/25, 1.25x => 22, 1.5x+ => 25
  const score = 25 * (0.15 + 0.85 * Math.min(1, ratio / 1.5));
  return Math.round(score);
}

export function computeStructuralClarity(input: {
  markdownOrText: string;
  h2s: string[];
}): number {
  const text = (input.markdownOrText ?? "").toLowerCase();

  let score = 0;

  // +5 if has FAQ section
  if (/\bfaq\b/.test(text) || /\bquestions?\b/.test(text)) score += 5;

  // +5 if has numbered steps
  if (/(^|\n)\s*\d+\.\s+\S+/m.test(input.markdownOrText)) score += 5;

  // +5 if has definition/glossary section
  if (/\bglossary\b/.test(text) || /\bdefinition\b/.test(text) || /\bkey terms\b/.test(text))
    score += 5;

  // +5 if H2 count >= 5
  if ((input.h2s ?? []).length >= 5) score += 5;

  // +5 if average section word count 150-400 (approx via splitting by H2 headings)
  const avgSectionWords = estimateAvgSectionWordCount(input.markdownOrText);
  if (avgSectionWords >= 150 && avgSectionWords <= 400) score += 5;

  return score;
}

export function computeCitationPotential(rawAnswer: string, targetContent: string): number {
  const answer = rawAnswer ?? "";
  const content = targetContent ?? "";

  let score = 0;

  // +5 per statistic mention (cap at 2 => 10)
  const statMentions = countMatches(answer, /\d+%|\d+x|\$\d+/g);
  score += Math.min(2, statMentions) * 5;

  // +5 if has expert quotes
  if (/(according to|says|reports)/i.test(answer)) score += 5;

  // +5 if has comparison table signals
  if (/\btable\b/i.test(answer) || /\|.+\|/.test(answer)) score += 5;

  // +5 if has numbered rankings
  if (/(^|\n)\s*\d+\.\s+\S+/m.test(answer) && /top|best|rank/i.test(answer)) score += 5;

  // +5 if has specific product/tool names (heuristic: capitalized tokens in answer not at sentence start)
  const toolSignals =
    countMatches(answer, /\b[A-Z][a-zA-Z0-9]{2,}\b/g) +
    countMatches(content, /\b[A-Z][a-zA-Z0-9]{2,}\b/g);
  if (toolSignals >= 8) score += 5;

  return score;
}

function estimateAvgSectionWordCount(markdownOrText: string): number {
  const raw = markdownOrText ?? "";
  const parts = raw.split(/(^|\n)##\s+/m);
  if (parts.length <= 1) {
    return raw.split(/\s+/).filter(Boolean).length;
  }

  // Roughly, content after each "##" marker
  const sections = raw.split(/\n##\s.+\n/gm).slice(1);
  if (sections.length === 0) return raw.split(/\s+/).filter(Boolean).length;
  const counts = sections.map((s) => s.split(/\s+/).filter(Boolean).length);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  return Math.round(avg);
}

function countMatches(text: string, re: RegExp): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function clamp25(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(25, Math.round(n)));
}

function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

