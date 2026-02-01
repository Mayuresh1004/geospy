import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteProps {
  params: Promise<{ id: string }>;
}

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_TIMEOUT_MS = 10000;

export async function POST(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const user = await requireAuth();
    const { id: projectId } = await params;

    const body = await request.json();
    const { query } = body;

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "query must be a non-empty string" },
        { status: 400 }
      );
    }

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const prompt = `You are a query enhancer for a Generative Engine Optimization (GEO) tool.

Given the user's short or informal query below, rewrite it into ONE clear, specific question that:
- Is ready to be sent to a generative AI (e.g. ChatGPT, Perplexity) to get a high-quality answer
- Keeps the user's intent and topic
- Is concise and well-formed (proper grammar, no slang unless it's the topic)
- Does NOT add extra questions or bullet points

Return ONLY the enhanced question, nothing else. No explanation, no quotes, no prefix.

User query:
${query.trim()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }).finally(() => clearTimeout(timeout));

    if (!geminiRes.ok) {
      const text = await geminiRes.text();
      return NextResponse.json(
        { error: `Gemini error: ${geminiRes.statusText}` },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "No enhanced query returned" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      enhanced_query: rawText.replace(/^["']|["']$/g, "").trim(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to enhance query" },
      { status: 500 }
    );
  }
}
