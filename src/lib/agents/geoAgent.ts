import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { GEOAgentState } from "@/lib/agents/types";
import { fetchProjectDataNode } from "@/lib/agents/nodes/fetchProjectDataNode";
import { scrapeNode } from "@/lib/agents/nodes/scrapeNode";
import { validateScrapeNode, shouldRetryAllScrapesFailed } from "@/lib/agents/nodes/validateScrapeNode";
import { competitorAnalysisNode } from "@/lib/agents/nodes/competitorAnalysisNode";
import { generateAnswerNode } from "@/lib/agents/nodes/generateAnswerNode";
import { analyzeNode } from "@/lib/agents/nodes/analyzeNode";
import { reportNode } from "@/lib/agents/nodes/reportNode";

export const GEOAgentStateAnnotation = Annotation.Root({
  projectId: Annotation<string>({ default: () => "" }),
  userId: Annotation<string>({ default: () => "" }),
  targetTopic: Annotation<string>({ default: () => "" }),
  urls: Annotation<GEOAgentState["urls"]>({
    default: () => [],
    reducer: (_left, right) => right,
  }),

  scrapeResults: Annotation<GEOAgentState["scrapeResults"]>({
    default: () => [],
    reducer: (_left, right) => right,
  }),
  generatedAnswers: Annotation<GEOAgentState["generatedAnswers"]>({
    default: () => [],
    reducer: (_left, right) => right,
  }),
  analysisResult: Annotation<GEOAgentState["analysisResult"]>({
    default: () => null,
    reducer: (_left, right) => right,
  }),
  recommendations: Annotation<GEOAgentState["recommendations"]>({
    default: () => [],
    reducer: (_left, right) => right,
  }),
  competitorMap: Annotation<GEOAgentState["competitorMap"]>({
    default: () => ({}),
    reducer: (_left, right) => right,
  }),

  currentStep: Annotation<GEOAgentState["currentStep"]>({
    default: () => "idle",
    reducer: (_left, right) => right,
  }),
  errors: Annotation<string[]>({
    default: () => [],
    reducer: (left, right) => left.concat(right ?? []),
  }),
  retryCount: Annotation<number>({
    default: () => 0,
    reducer: (_left, right) => right,
  }),
  logs: Annotation<string[]>({
    default: () => [],
    reducer: (left, right) => left.concat(right ?? []),
  }),
});

export function createGeoAgentGraph() {
  const builder = new StateGraph(GEOAgentStateAnnotation);

  builder.addNode("fetchProjectData", fetchProjectDataNode);
  builder.addNode("scrape", async (s: GEOAgentState, cfg) => {
    const nextRetry = shouldRetryAllScrapesFailed(s) ? (s.retryCount ?? 0) + 1 : s.retryCount ?? 0;
    const update = await scrapeNode(
      s,
      cfg as unknown as Parameters<typeof scrapeNode>[1]
    );
    // Always write retryCount so conditional routing is stable.
    return { ...update, retryCount: nextRetry };
  });
  builder.addNode("validateScrape", validateScrapeNode);
  builder.addNode("competitorAnalysis", competitorAnalysisNode);
  builder.addNode("generate", generateAnswerNode);
  builder.addNode("analyze", analyzeNode);
  builder.addNode("report", reportNode);

  builder.addEdge(START, "fetchProjectData");
  builder.addEdge("fetchProjectData", "scrape");

  // Retry scrape if all failed and retryCount < 2
  builder.addConditionalEdges("scrape", (s: GEOAgentState) => {
    if (shouldRetryAllScrapesFailed(s)) return "scrape";
    return "competitorAnalysis";
  });

  builder.addEdge("competitorAnalysis", "validateScrape");

  builder.addConditionalEdges("validateScrape", (s: GEOAgentState) => {
    if (s.currentStep === "failed") return "report";
    return "generate";
  });

  builder.addEdge("generate", "analyze");
  builder.addEdge("analyze", "report");
  builder.addEdge("report", END);

  return builder.compile();
}

