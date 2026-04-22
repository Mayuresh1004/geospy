import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export async function expandQueries(topic: string): Promise<string[]> {
  const baseTopic = (topic ?? "").trim();
  const baseQuestion = baseTopic.endsWith("?") ? baseTopic : `What is ${baseTopic}?`;

  const templated: string[] = [
    baseQuestion,
    `Best ${baseTopic} for beginners`,
    `How to choose ${baseTopic}`,
    `What makes a good ${baseTopic}`,
    `${baseTopic} comparison guide`,
  ].map((q) => q.trim()).filter(Boolean);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return unique(templated).slice(0, 5);

  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: "gemini-2.5-flash",
    temperature: 0.6,
  });

  const prompt = `Generate 4 alternative search queries for the topic: "${baseTopic}".
Return JSON: { "queries": ["q1", "q2", "q3", "q4"] }
Make them diverse: how-to, comparison, beginner, expert angles.`;

  const extra = await model
    .invoke(prompt)
    .then((m) => (typeof m.content === "string" ? m.content : ""))
    .then((t) => parseQueriesJson(t))
    .catch(() => []);

  return unique([...templated, ...extra]).slice(0, 5);
}

function parseQueriesJson(raw: string): string[] {
  const text = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const queries = (parsed as Record<string, unknown>).queries;
    if (!Array.isArray(queries)) return [];
    return queries
      .map((q) => (typeof q === "string" ? q.trim() : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const i of items) {
    const key = i.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(i);
  }
  return out;
}

