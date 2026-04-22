import { generateText } from "@/lib/gemini";
import { db } from "@/lib/db";

type RecommendationRow = {
  id: string;
  title: string;
  description: string;
  action_items: unknown[] | null;
  priority: string;
};

type ImprovementResult = {
  score: number;
  reason: string;
  improved_description: string;
};

export async function runImprovementAgent(input: {
  projectId: string;
  recommendations: RecommendationRow[];
}): Promise<void> {
  const topHighPriority = input.recommendations
    .filter((r) => r.priority === "high")
    .slice(0, 3);

  if (topHighPriority.length === 0) return;

  for (const rec of topHighPriority) {
    const judged = await judgeRecommendation(rec);
    if (!judged) continue;

    const nextScore = clamp10(judged.score);
    const updatePayload: Record<string, unknown> = {
      quality_score: nextScore,
    };

    if (nextScore < 7 && judged.improved_description?.trim()) {
      updatePayload.description = judged.improved_description.trim();
    }

    await db.from("recommendations").update(updatePayload).eq("id", rec.id);
  }
}

async function judgeRecommendation(
  recommendation: RecommendationRow
): Promise<ImprovementResult | null> {
  const actionItems = Array.isArray(recommendation.action_items)
    ? recommendation.action_items
    : [];

  const prompt = `Rate this GEO recommendation 1-10 for specificity and actionability.
Recommendation: ${recommendation.title} - ${recommendation.description}
Action items: ${JSON.stringify(actionItems)}
Return JSON: { score: number, reason: string, improved_description: string }`;

  try {
    const raw = await generateText(prompt);
    const parsed = parseJsonObject(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const obj = parsed;
    return {
      score: typeof obj.score === "number" ? obj.score : 5,
      reason: typeof obj.reason === "string" ? obj.reason : "",
      improved_description:
        typeof obj.improved_description === "string"
          ? obj.improved_description
          : recommendation.description,
    };
  } catch {
    return null;
  }
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

  // Try direct parse first.
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // continue
  }

  // Fallback: extract first {...} block if model returned extra text.
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    const slice = cleaned.slice(first, last + 1);
    try {
      const parsed = JSON.parse(slice) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function clamp10(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const v = Math.max(0, Math.min(10, value));
  return Math.round(v * 10) / 10;
}

