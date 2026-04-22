import { db } from "@/lib/db";
import type { GEOAgentState } from "@/lib/agents/types";

export async function reportNode(
  state: GEOAgentState,
  config?: {
    configurable?: {
      onLog?: (line: string) => void;
      onEvent?: (evt: { step: string; log?: string; progress?: number }) => void;
      runStartedAtMs?: number;
    };
  }
): Promise<Partial<GEOAgentState>> {
  config?.configurable?.onLog?.("Writing agent run log...");
  config?.configurable?.onEvent?.({
    step: "complete",
    log: "Finalizing run...",
    progress: 95,
  });

  const startedAt = config?.configurable?.runStartedAtMs ?? Date.now();
  const status = state.currentStep === "failed" ? "failed" : "complete";

  const stepsCompleted = [
    state.scrapeResults.length ? "scraping" : null,
    state.generatedAnswers.length ? "generating" : null,
    state.analysisResult ? "analyzing" : null,
  ].filter(Boolean) as string[];

  const summary = {
    projectId: state.projectId,
    scrape: {
      total: state.scrapeResults.length,
      succeeded: state.scrapeResults.filter((r) => r.status === "success").length,
    },
    answers: state.generatedAnswers.length,
    analysisId: state.analysisResult?.id ?? null,
    recommendations: state.recommendations.length,
  };

  const { data: runRow, error } = await db
    .from("agent_runs")
    .insert({
      project_id: state.projectId,
      user_id: state.userId,
      status,
      steps_completed: stepsCompleted,
      errors: state.errors ?? [],
      summary,
      started_at: new Date(startedAt).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
    })
    .select("id")
    .single();

  if (error) {
    // If agent_runs isn't present yet in a given env, don't fail the whole workflow.
    config?.configurable?.onLog?.(`agent_runs insert failed: ${error.message ?? String(error)}`);
  }

  await db
    .from("projects")
    .update({
      last_agent_run_at: new Date().toISOString(),
    })
    .eq("id", state.projectId);

  return {
    currentStep: status === "complete" ? "complete" : "failed",
    logs: [
      `Run recorded${runRow?.id ? ` (${runRow.id})` : ""}. Status=${status}.`,
    ],
  };
}

