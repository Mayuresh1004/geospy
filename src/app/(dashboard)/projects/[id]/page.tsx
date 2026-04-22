// app/(dashboard)/projects/[id]/page.tsx
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import AgentRunner from "@/components/projects/AgentRunner";
import DeleteProjectButton from "@/components/projects/DeleteProjectButton";
import OptimizationGauge from "@/components/projects/OptimizationGauge";
import HistoryChart from "@/components/projects/HistoryChart";
import AnalyzeButton from "@/components/projects/AnalyzeButton";
import CompetitorGapAnalysis from "@/components/projects/CompetitorGapAnalysis";
import ExportReportButton from "@/components/projects/ExportReportButton";
import AgentRunRealtime from "@/components/projects/AgentRunRealtime";
import AgentRunHistory from "@/components/projects/AgentRunHistory";
import type { AgentRunRow } from "@/lib/agents/agentRunTypes";
import Link from "next/link";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import React from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const user = await requireAuth();

  // ✅ unwrap params ONCE
  const { id } = await params;

  // =========================
  // Fetch project
  // =========================
  const { data: project } = await db
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    notFound();
  }

  // =========================
  // Fetch URLs
  // =========================
  const { data: urls } = await db
    .from("urls")
    .select("*")
    .eq("project_id", id);

  const urlIds = (urls ?? []).map((u) => u.id);

  // =========================
  // Recommendations count
  // =========================
  const { count: recommendationsCount } = await db
    .from("recommendations")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id);

  // =========================
  // Latest analysis (for depth + semantic coverage)
  // =========================
  const { data: analysisHistory } = await db
    .from("analysis_results")
    .select("*")
    .eq("project_id", id)
    .order("analyzed_at", { ascending: false });

  const latestAnalysis = analysisHistory?.[0];

  const targetUrls = urls?.filter((u) => u.type === "target") ?? [];
  const competitorUrls = urls?.filter((u) => u.type === "competitor") ?? [];

  const { data: agentRuns } = await db
    .from("agent_runs")
    .select("*")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(5);

  const agentRunsTyped = (agentRuns ?? []) as unknown as AgentRunRow[];
  const latestRun = agentRunsTyped[0] ?? null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {project.name}
          </h1>
          {latestRun?.completed_at ? (
            <p className="text-sm text-muted-foreground mt-2">
              Last agent run: {new Date(latestRun.completed_at).toLocaleString()}
              {typeof latestRun.duration_ms === "number"
                ? ` · ${Math.round(latestRun.duration_ms / 1000)}s`
                : ""}
            </p>
          ) : null}
          {project.description && (
            <p className="text-muted-foreground mt-2">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AnalyzeButton projectId={id} />
          {latestAnalysis && (
            <ExportReportButton project={project} analysis={latestAnalysis} />
          )}
          <DeleteProjectButton
            projectId={id}
            projectName={project.name}
            variant="outline"
            size="default"
            className="shrink-0 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
          />
        </div>
      </div>

      {/* Target Topic */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8 flex items-start gap-3">
        <Target className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <p className="text-sm font-medium text-primary">
            Target Topic
          </p>
          <p className="text-foreground mt-1">
            {project.target_topic}
          </p>
        </div>
      </div>

      <AgentRunRealtime projectId={id} initialLatestRun={latestRun} />

      {/* Progress */}
      <AgentRunner projectId={id} />

      {/* Analysis scores (depth + semantic coverage) */}
      {latestAnalysis && (
        <div className="mb-8 space-y-8">
          <div className="p-6 rounded-2xl border border-border/50 bg-linear-to-b from-muted/20 to-transparent">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              Performance Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex justify-center">
                <OptimizationGauge
                  score={latestAnalysis.content_depth_score ?? 0}
                  label="Depth Score"
                  description="Coverage vs competitors"
                  color="text-blue-500"
                />
              </div>
              <div className="flex justify-center">
                <OptimizationGauge
                  score={typeof latestAnalysis.competitor_coverage?.semantic_coverage === "number" ? latestAnalysis.competitor_coverage.semantic_coverage : 0}
                  label="Semantic Coverage"
                  description="Topic overlap with AI"
                  color="text-purple-500"
                />
              </div>
              <div className="flex justify-center">
                <OptimizationGauge
                  score={typeof latestAnalysis.geo_score_breakdown?.structuralClarity === "number" ? latestAnalysis.geo_score_breakdown.structuralClarity * 4 : 0}
                  label="Structure"
                  description="Clarity & hierarchy"
                  color="text-emerald-500"
                />
              </div>
              <div className="flex justify-center">
                <OptimizationGauge
                  score={typeof latestAnalysis.geo_score_breakdown?.citationPotential === "number" ? latestAnalysis.geo_score_breakdown.citationPotential * 4 : 0}
                  label="Citation"
                  description="Quote-ability signals"
                  color="text-amber-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <div className="rounded-full border border-border bg-muted/20 px-4 py-2 text-sm">
                <span className="text-muted-foreground">GEO Score</span>{" "}
                <span className="font-semibold text-foreground">
                  {typeof latestAnalysis.geo_score_breakdown?.total === "number"
                    ? latestAnalysis.geo_score_breakdown.total
                    : 0}
                  /100
                </span>
              </div>
            </div>
          </div>

          {/* Historical Charts & Gap Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <HistoryChart data={analysisHistory || []} />
            </div>
            <div className="lg:col-span-1">
              <CompetitorGapAnalysis analysis={latestAnalysis} />
            </div>
          </div>
        </div>
      )}

      {/* URLs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Target URLs */}
        {/* Target URLs */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Your URLs ({targetUrls.length})
          </h3>
          <div className="space-y-2">
            {targetUrls.map((url) => (
              <div
                key={url.id}
                className="text-sm text-foreground truncate bg-muted/50 px-3 py-2 rounded border border-border/50"
              >
                {url.url}
              </div>
            ))}
          </div>
        </div>

        {/* Competitor URLs */}
        {/* Competitor URLs */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Competitor URLs ({competitorUrls.length})
          </h3>
          {competitorUrls.length > 0 ? (
            <div className="space-y-2">
              {competitorUrls.map((url) => (
                <div
                  key={url.id}
                  className="text-sm text-foreground truncate bg-muted/50 px-3 py-2 rounded border border-border/50"
                >
                  {url.url}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No competitor URLs added
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={`/projects/${id}/insights`}>
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    AI Insights
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View AI-generated answers
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </Link>

        <Link href={`/projects/${id}/recommendations`}>
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Recommendations
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {recommendationsCount ?? 0} actionable insights
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </Link>
      </div>

      <AgentRunHistory runs={agentRunsTyped} />
    </div>
  );
}
