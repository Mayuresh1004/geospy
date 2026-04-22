"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AgentRunRow } from "@/lib/agents/agentRunTypes";

function formatDuration(ms: number | null | undefined) {
  if (!ms || ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function statusPill(status: string) {
  if (status === "complete")
    return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (status === "failed")
    return "bg-destructive/10 text-destructive border-destructive/20";
  if (status === "running")
    return "bg-primary/10 text-primary border-primary/20";
  return "bg-muted text-muted-foreground border-border";
}

export default function AgentRunHistory({ runs }: { runs: AgentRunRow[] }) {
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  if (!runs || runs.length === 0) return null;

  return (
    <div className="mt-8 bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold text-foreground">Agent Runs</h2>
        <p className="text-sm text-muted-foreground">Last {Math.min(5, runs.length)} runs</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-12 gap-2 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <div className="col-span-4">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2">Recs</div>
          <div className="col-span-2">Errors</div>
        </div>

        <div className="divide-y divide-border">
          {runs.slice(0, 5).map((r) => {
            const isOpen = Boolean(open[r.id]);
            const summary =
              r.summary && typeof r.summary === "object"
                ? (r.summary as Record<string, unknown>)
                : null;
            const recCount =
              typeof summary?.recommendations === "number"
                ? summary.recommendations
                : "—";
            const errorCount = (r.errors ?? []).length;
            return (
              <div key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpen((p) => ({ ...p, [r.id]: !isOpen }))}
                  className="w-full text-left grid grid-cols-12 gap-2 px-3 py-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-2">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-foreground">
                      {r.started_at ? new Date(r.started_at).toLocaleString() : "—"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                        statusPill(r.status),
                      ].join(" ")}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-foreground/80">
                    {formatDuration(r.duration_ms ?? null)}
                  </div>
                  <div className="col-span-2 text-sm text-foreground/80">{recCount}</div>
                  <div className="col-span-2 text-sm text-foreground/80">
                    {errorCount ? `${errorCount}` : "0"}
                  </div>
                </button>

                {isOpen ? (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="rounded-lg border border-border bg-muted/10 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Steps completed
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(r.steps_completed ?? []).length ? (
                            (r.steps_completed ?? []).map((s) => (
                              <span
                                key={s}
                                className="text-xs rounded-full border border-border px-2 py-0.5 bg-background"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border bg-muted/10 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Errors
                        </p>
                        {(r.errors ?? []).length ? (
                          <ul className="space-y-1">
                            {(r.errors ?? []).slice(0, 6).map((e, idx) => (
                              <li key={idx} className="text-xs text-foreground/80">
                                {e}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

