"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { toast } from "@/hooks/use-toast";
import type { AgentRunRow } from "@/lib/agents/agentRunTypes";

export default function AgentRunRealtime({
  projectId,
  initialLatestRun,
}: {
  projectId: string;
  initialLatestRun: AgentRunRow | null;
}) {
  const router = useRouter();
  const [latestRun, setLatestRun] = React.useState<AgentRunRow | null>(
    initialLatestRun
  );

  const prevStatusRef = React.useRef<string | null>(
    initialLatestRun?.status ?? null
  );

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`agent_runs:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_runs",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = payload.new as unknown as AgentRunRow | null;
          if (!row?.id) return;
          setLatestRun(row);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  React.useEffect(() => {
    const status = latestRun?.status ?? null;
    const prev = prevStatusRef.current;
    if (!status) return;

    if (prev !== status) {
      if (status === "complete") {
        toast({
          title: "Analysis complete",
          description: "New recommendations and GEO score are ready.",
        });
        router.refresh();
      }
      if (status === "failed") {
        toast({
          title: "Analysis failed",
          description:
            (latestRun?.errors ?? []).slice(0, 2).join("\n") ||
            "See run history for details.",
          variant: "destructive",
        });
      }
    }
    prevStatusRef.current = status;
  }, [latestRun, router]);

  const isRunning = latestRun?.status === "running";

  if (!latestRun) return null;

  return (
    <div className="mb-6">
      {isRunning ? (
        <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-primary">
          <span className="font-medium">Analysis in progress…</span>{" "}
          {latestRun.started_at ? (
            <span className="text-primary/80">
              Started {new Date(latestRun.started_at).toLocaleString()}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

