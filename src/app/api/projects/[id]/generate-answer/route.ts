import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { enhanceQuery } from "@/lib/geo/enhanceQuery";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_TIMEOUT_MS = 15000;

export async function POST(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const user = await requireAuth();
    const { id: projectId } = await params;

    const body = await request.json();
    const { queries } = body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: "queries must be a non-empty array" },
        { status: 400 }
      );
    }

    // =========================
    // Verify project ownership
    // =========================
    const { data: project } = await db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // =========================
    // Enhance each query in background, then generate answers (parallel)
    // =========================
    const apiKey = process.env.GEMINI_API_KEY ?? "";
    const results = await Promise.all(
      queries.map(async (query) => {
        const enhanced =
          apiKey ? await enhanceQuery(query.trim(), apiKey).catch(() => null) : null;
        const queryToUse = enhanced ?? query.trim();
        return generateSingleAnswer(queryToUse, projectId);
      })
    );

    const succeeded = results.filter(r => r.status === "success").length;
    const failed = results.length - succeeded;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        succeeded,
        failed,
      },
    });
  } catch (error) {
    console.error("[GENERATE_ANSWER_ERROR]", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate answers" },
      { status: 500 }
    );
  }
}

// =========================
// Core generation logic
// =========================
async function generateSingleAnswer(
  query: string,
  projectId: string
) {
  try {
    const prompt = `
Answer the following question in a comprehensive, detailed way. Your answer should:
- Be 150-350 words (or longer if the topic needs it).
- Cover the main points with enough detail to be useful (e.g. for lists: 2-4 sentences per item with key benefits or features).
- Use clear structure: short intro, then body with distinct points or paragraphs, then a brief conclusion if appropriate.

Then return ONLY valid JSON in the exact format below. No markdown. No explanation. No backticks.

Question:
${query}

JSON format:
{
  "answer": "string",
  "topics": ["topic1", "topic2"],
  "entities": ["entity1", "entity2"]
}
`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      GEMINI_TIMEOUT_MS
    );

    const response = await fetch(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    ).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini error: ${response.statusText} - ${text}`);
    }

    const data = await response.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText || !rawText.trim().startsWith("{")) {
      throw new Error("Non-JSON response from Gemini");
    }

    const parsed = JSON.parse(rawText);

    if (typeof parsed.answer !== "string") {
      throw new Error("Invalid answer format");
    }

    const answer = parsed.answer;
    const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
    const entities = Array.isArray(parsed.entities) ? parsed.entities : [];

    const format = classifyAnswerFormat(answer);

    const { data: aiAnswer, error } = await db
      .from("ai_answers")
      .insert({
        project_id: projectId,
        query,
        raw_answer: answer,
        answer_format: format,
        key_concepts: topics,
        entities,
        metadata: {
          model: GEMINI_MODEL,
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    return {
      query,
      status: "success",
      answer: aiAnswer,
    };
  } catch (error) {
    console.error(`Generation failed for "${query}":`, error);

    return {
      query,
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    };
  }
}

// =========================
// Helpers
// =========================
function classifyAnswerFormat(answer: string): string {
  if (/^\d+\.|^Step \d+/m.test(answer)) return "step_by_step";
  if (/^[\*\-•]/m.test(answer)) return "bullet_list";
  if (answer.length < 200) return "definition";
  return "paragraph";
}
