const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const ENHANCE_TIMEOUT_MS = 10000;

/**
 * Enhances a short or informal query into a clear, specific question for generative AI.
 * Returns the enhanced query, or null if enhancement fails (caller should use original).
 */
export async function enhanceQuery(
  query: string,
  apiKey: string
): Promise<string | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const prompt = `You are a query enhancer for a Generative Engine Optimization (GEO) tool.

Given the user's short or informal query below, rewrite it into ONE clear, specific question that:
- Is ready to be sent to a generative AI (e.g. ChatGPT, Perplexity) to get a high-quality answer
- Keeps the user's intent and topic
- Is concise and well-formed (proper grammar, no slang unless it's the topic)
- Does NOT add extra questions or bullet points

Return ONLY the enhanced question, nothing else. No explanation, no quotes, no prefix.

User query:
${trimmed}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENHANCE_TIMEOUT_MS);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) return null;

    const data = await res.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!rawText) return null;

    return rawText.replace(/^["']|["']$/g, "").trim();
  } catch {
    return null;
  }
}
