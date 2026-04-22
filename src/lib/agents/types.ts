export type UrlType = "target" | "competitor";

export interface GEOAgentState {
  projectId: string;
  userId: string;
  targetTopic: string;
  urls: Array<{ id: string; url: string; type: UrlType }>;

  // Step results
  scrapeResults: Array<{
    urlId: string;
    status: "success" | "failed";
    wordCount: number;
  }>;
  generatedAnswers: Array<{ id: string; query: string; format: string }>;
  analysisResult: { id: string; depthScore: number; semanticCoverage: number } | null;
  recommendations: Array<{ priority: string; title: string }>;
  competitorMap: Record<
    string,
    {
      contentPillars: Array<{ heading: string; estimatedWordCount: number }>;
      externalLinksCount: number;
      hasSchemaMarkup: boolean;
    }
  >;

  // Agent control
  currentStep:
    | "idle"
    | "scraping"
    | "generating"
    | "analyzing"
    | "complete"
    | "failed";
  errors: string[];
  retryCount: number;
  logs: string[];
}

export function createInitialGEOAgentState(input: {
  projectId: string;
  userId: string;
}): GEOAgentState {
  return {
    projectId: input.projectId,
    userId: input.userId,
    targetTopic: "",
    urls: [],
    scrapeResults: [],
    generatedAnswers: [],
    analysisResult: null,
    recommendations: [],
    competitorMap: {},
    currentStep: "idle",
    errors: [],
    retryCount: 0,
    logs: [],
  };
}

export type GEOAgentEvent =
  | { step: GEOAgentState["currentStep"]; log?: string; progress?: number }
  | { step: "complete"; progress: 100; summary: unknown }
  | { step: "failed"; log?: string; progress?: number; error?: string };

