import { db } from "@/lib/db";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { GEOAgentState } from "@/lib/agents/types";
import { expandQueries } from "@/lib/agents/queryExpansionAgent";
import pLimit from "p-limit";

export async function generateAnswerNode(
  state: GEOAgentState,
  config?: {
    configurable?: {
      onLog?: (line: string) => void;
      onEvent?: (evt: { step: string; log?: string; progress?: number }) => void;
    };
  }
): Promise<Partial<GEOAgentState>> {
  const budgetMode = process.env.GEMINI_BUDGET_MODE !== "0";
  config?.configurable?.onLog?.("Generating AI answers...");
  config?.configurable?.onEvent?.({
    step: "generating",
    log: "Generating AI answers...",
    progress: 50,
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: "gemini-2.5-flash",
    temperature: 0.4,
  });

  const queries = await expandQueries(state.targetTopic);

  config?.configurable?.onLog?.(`Answer queries: ${queries.join(" | ")}`);

  const limit = pLimit(budgetMode ? 1 : 2);
  const settled = await Promise.allSettled(
    queries.map(async (query) =>
      limit(() => generateSingleAnswer(model, query, state.projectId))
    )
  );

  const results = settled
    .map((s, idx) => (s.status === "fulfilled" ? s.value : { status: "failed" as const, query: queries[idx], error: String(s.reason ?? "Unknown error") }));

  const generatedAnswers = results
    .filter((r) => r.status === "success")
    .map((r) => ({
      id: r.answerId,
      query: r.query,
      format: r.format,
    }));

  const errors = results
    .filter((r) => r.status === "failed")
    .map((r) => `Generate failed: ${r.query} (${r.error})`);

  return {
    currentStep: "generating",
    generatedAnswers,
    errors: errors.length ? [...(state.errors ?? []), ...errors] : state.errors,
    logs: [
      `Generated ${generatedAnswers.length}/${queries.length} AI answers.`,
    ],
  };
}

// (Variants now handled by queryExpansionAgent)

async function generateSingleAnswer(
  model: ChatGoogleGenerativeAI,
  query: string,
  projectId: string
): Promise<
  | { status: "success"; query: string; answerId: string; format: string; rawAnswer: string }
  | { status: "failed"; query: string; error: string }
> {
  try {
    const prompt = `
Answer the following question in a comprehensive, detailed way. Your answer should:
- Be 150-350 words (or longer if the topic needs it).
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
`.trim();

    const raw = await invokeWithRetry(() => model.invoke(prompt));
    const rawText = typeof raw.content === "string" ? raw.content : "";
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    if (!cleaned.startsWith("{")) throw new Error("Non-JSON response from Gemini");

    const parsed = JSON.parse(cleaned);
    if (typeof parsed?.answer !== "string") throw new Error("Invalid answer format");

    const answer = parsed.answer as string;
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
          model: "gemini-2.5-flash",
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;
    if (!aiAnswer?.id) throw new Error("Insert returned no id");

    return {
      status: "success",
      query,
      answerId: String(aiAnswer.id),
      format: String(aiAnswer.answer_format ?? format),
      rawAnswer: String(aiAnswer.raw_answer ?? answer),
    };
  } catch (e) {
    return {
      status: "failed",
      query,
      error: summarizeGeminiError(e),
    };
  }
}

function classifyAnswerFormat(answer: string): string {
  if (/^\d+\.|^Step \d+/m.test(answer)) return "step_by_step";
  if (/^[\*\-•]/m.test(answer)) return "bullet_list";
  if (answer.length < 200) return "definition";
  return "paragraph";
}

async function invokeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!shouldRetryGeminiError(error) || attempt === maxAttempts) {
        throw error;
      }

      const waitMs = computeRetryDelayMs(error, attempt);
      await sleep(waitMs);
    }
  }

  throw lastError ?? new Error("Failed to invoke Gemini model");
}

function shouldRetryGeminiError(error: unknown): boolean {
  const message = summarizeGeminiError(error).toLowerCase();

  if (message.includes("quota exceeded") || message.includes("free_tier_requests")) {
    return false;
  }

  return (
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("429")
  );
}

function computeRetryDelayMs(error: unknown, attempt: number): number {
  const message = summarizeGeminiError(error);
  const retryInfoMatch = message.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i);
  if (retryInfoMatch) {
    const seconds = Number(retryInfoMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
  }

  const base = 1000;
  return base * Math.pow(2, attempt - 1);
}

function summarizeGeminiError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

