import { db } from "@/lib/db";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { GEOAgentState } from "@/lib/agents/types";
import { expandQueries } from "@/lib/agents/queryExpansionAgent";

export async function generateAnswerNode(
  state: GEOAgentState,
  config?: {
    configurable?: {
      onLog?: (line: string) => void;
      onEvent?: (evt: { step: string; log?: string; progress?: number }) => void;
    };
  }
): Promise<Partial<GEOAgentState>> {
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

  const settled = await Promise.allSettled(
    queries.map(async (query) => generateSingleAnswer(model, query, state.projectId))
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

    const raw = await model.invoke(prompt);
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
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

function classifyAnswerFormat(answer: string): string {
  if (/^\d+\.|^Step \d+/m.test(answer)) return "step_by_step";
  if (/^[\*\-•]/m.test(answer)) return "bullet_list";
  if (answer.length < 200) return "definition";
  return "paragraph";
}

