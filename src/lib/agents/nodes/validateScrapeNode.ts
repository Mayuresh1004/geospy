import type { GEOAgentState } from "@/lib/agents/types";

export function validateScrapeNode(
  state: GEOAgentState,
  config?: { configurable?: { onLog?: (line: string) => void } }
): Partial<GEOAgentState> {
  const succeeded = state.scrapeResults.filter((r) => r.status === "success")
    .length;
  config?.configurable?.onLog?.(
    `Validate scrape: ${succeeded}/${state.scrapeResults.length} succeeded.`
  );

  if (succeeded === 0) {
    return {
      currentStep: "failed",
      errors: [
        ...(state.errors ?? []),
        "All scrapes failed — cannot generate answers.",
      ],
    };
  }

  return { currentStep: "generating" };
}

export function shouldRetryAllScrapesFailed(state: GEOAgentState): boolean {
  const succeeded = state.scrapeResults.filter((r) => r.status === "success")
    .length;
  return succeeded === 0 && (state.retryCount ?? 0) < 2;
}

