import { db } from "@/lib/db";
import type { GEOAgentState } from "@/lib/agents/types";

export async function fetchProjectDataNode(
  state: GEOAgentState,
  config?: {
    configurable?: {
      onLog?: (line: string) => void;
      onEvent?: (evt: { step: string; log?: string; progress?: number }) => void;
    };
  }
): Promise<Partial<GEOAgentState>> {
  config?.configurable?.onLog?.("Loading project + URLs...");
  config?.configurable?.onEvent?.({
    step: "idle",
    log: "Loading project + URLs...",
    progress: 5,
  });

  const { data: project, error: projectError } = await db
    .from("projects")
    .select("id, user_id, target_topic")
    .eq("id", state.projectId)
    .single();

  if (projectError || !project) {
    throw new Error("Project not found");
  }

  if (project.user_id !== state.userId) {
    throw new Error("Unauthorized");
  }

  const { data: urls, error: urlError } = await db
    .from("urls")
    .select("id, url, type")
    .eq("project_id", state.projectId);

  if (urlError) throw urlError;
  const safeUrls =
    (urls ?? []).map((u) => ({
      id: String(u.id),
      url: String(u.url),
      type: u.type as "target" | "competitor",
    })) ?? [];

  const hasTarget = safeUrls.some((u) => u.type === "target");
  if (!hasTarget) {
    throw new Error("At least one target URL is required");
  }

  return {
    targetTopic: project.target_topic ?? "",
    urls: safeUrls,
    logs: [`Loaded ${safeUrls.length} URLs for project.`],
  };
}

