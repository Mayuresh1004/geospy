import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import { createInitialGEOAgentState } from "@/lib/agents/types";

export const runtime = "nodejs";

interface RouteProps {
  params: Promise<{ id: string }>;
}

function sseHeaders() {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  } as const;
}

function encodeSse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error";
    }
  }
  return "Unknown error";
}

async function runAgentSse(request: NextRequest, projectId: string) {
  const user = await requireAuth();
  const runStartedAtMs = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const send = (payload: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(encodeSse(payload)));
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      // Close cleanly on client disconnect
      request.signal.addEventListener("abort", () => {
        close();
      });

      (async () => {
        try {
          send({ step: "idle", log: "Starting agent run...", progress: 5 });

          // Lazy import so langgraph doesn't end up in client bundles.
          const { createGeoAgentGraph } = await import("@/lib/agents/geoAgent");

          const graph = createGeoAgentGraph();
          const initialState = createInitialGEOAgentState({
            projectId,
            userId: user.id,
          });
          const finalState = await graph.invoke(
            initialState as unknown as Parameters<typeof graph.invoke>[0],
            {
              configurable: {
                onLog: (line: string) => {
                  send({ step: "idle", log: line });
                },
                onEvent: (evt: { step: string; log?: string; progress?: number }) => {
                  send(evt);
                },
                runStartedAtMs,
              },
            } as unknown as LangGraphRunnableConfig
          );

          const step = finalState.currentStep;
          if (step === "failed") {
            send({
              step: "failed",
              progress: 100,
              error: (finalState.errors ?? []).join("\n") || "Agent failed",
              summary: finalState,
            });
          } else {
            send({ step: "complete", progress: 100, summary: finalState });
          }
        } catch (e) {
          const errorMessage = toErrorMessage(e);
          console.error("[run-agent] workflow failed:", e);
          send({
            step: "failed",
            progress: 100,
            error: errorMessage,
          });
        } finally {
          close();
        }
      })();
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { id: projectId } = await params;
  return runAgentSse(request, projectId);
}

// EventSource uses GET; POST is kept for parity with existing API style.
export async function POST(request: NextRequest, { params }: RouteProps) {
  const { id: projectId } = await params;
  return runAgentSse(request, projectId);
}

