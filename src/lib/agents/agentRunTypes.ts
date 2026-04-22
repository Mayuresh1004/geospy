export type AgentRunRow = {
  id: string;
  project_id: string;
  user_id?: string;
  status: "running" | "complete" | "failed" | string;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
  steps_completed?: string[] | null;
  errors?: string[] | null;
  summary?: unknown;
};

