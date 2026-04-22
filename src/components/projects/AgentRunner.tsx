"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RotateCcw } from "lucide-react";

type Step = "idle" | "scraping" | "generating" | "analyzing" | "complete" | "failed";

export default function AgentRunner({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [running, setRunning] = React.useState(false);
  const [step, setStep] = React.useState<Step>("idle");
  const [progress, setProgress] = React.useState(0);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const esRef = React.useRef<EventSource | null>(null);

  const close = React.useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  React.useEffect(() => {
    return () => close();
  }, [close]);

  const start = React.useCallback(() => {
    setRunning(true);
    setError(null);
    setLogs([]);
    setStep("idle");
    setProgress(0);

    close();
    const es = new EventSource(`/api/projects/${projectId}/run-agent`);
    esRef.current = es;

    es.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data ?? "{}");
        if (payload?.step) setStep(payload.step);
        if (typeof payload?.progress === "number") setProgress(payload.progress);
        if (payload?.log) {
          setLogs((prev) => [...prev, String(payload.log)].slice(-200));
        }
        if (payload?.step === "complete") {
          setRunning(false);
          setProgress(100);
          close();
          router.refresh();
        }
        if (payload?.step === "failed") {
          setRunning(false);
          close();
          setError(String(payload?.error ?? "Agent failed"));
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setRunning(false);
      close();
      setError("Stream disconnected. Please retry.");
    };
  }, [close, projectId, router]);

  const steps: Array<{ id: Step; label: string }> = [
    { id: "scraping", label: "Scraping" },
    { id: "generating", label: "Generating" },
    { id: "analyzing", label: "Analyzing" },
    { id: "complete", label: "Complete" },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Run Full Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scrape → Generate answers → Analyze → Recommendations (streaming)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!running ? (
            <Button onClick={start} className="shrink-0">
              <Play className="w-4 h-4 mr-2" />
              Run Full Analysis
            </Button>
          ) : (
            <Button disabled className="shrink-0">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </Button>
          )}
          {error && (
            <Button variant="outline" onClick={start} className="shrink-0">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{step === "idle" ? "Waiting" : `Step: ${step}`}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {steps.map((s) => {
            const active = step === s.id;
            const done =
              step === "complete" ||
              (step === "analyzing" && (s.id === "scraping" || s.id === "generating")) ||
              (step === "generating" && s.id === "scraping");
            return (
              <span
                key={s.id}
                className={[
                  "text-xs rounded-full border px-3 py-1",
                  active
                    ? "border-primary text-primary bg-primary/5"
                    : done
                      ? "border-border text-foreground/80 bg-muted/30"
                      : "border-border text-muted-foreground bg-transparent",
                ].join(" ")}
              >
                {s.label}
              </span>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-4 max-h-56 overflow-auto rounded-lg border border-border bg-muted/20 p-3">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logs yet.</p>
          ) : (
            <div className="space-y-1">
              {logs.map((l, i) => (
                <div key={i} className="text-xs text-foreground/80">
                  {l}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

