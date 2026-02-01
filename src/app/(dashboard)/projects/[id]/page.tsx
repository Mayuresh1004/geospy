// app/(dashboard)/projects/[id]/page.tsx
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ProjectProgress from "@/components/projects/ProjectProgress";
import DeleteProjectButton from "@/components/projects/DeleteProjectButton";
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
  // Scraped content count
  // =========================
  const { count: scrapedCount } = await db
    .from("scraped_content")
    .select("*", { count: "exact", head: true })
    .in("url_id", urlIds)
    .eq("status", "success");

  // =========================
  // AI answers count
  // =========================
  const { count: answersCount } = await db
    .from("ai_answers")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id);

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
  const { data: latestAnalysis } = await db
    .from("analysis_results")
    .select("*")
    .eq("project_id", id)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const targetUrls = urls?.filter((u) => u.type === "target") ?? [];
  const competitorUrls = urls?.filter((u) => u.type === "competitor") ?? [];

  return (
    <div>
      {/* Header */}
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-muted-foreground mt-2">
              {project.description}
            </p>
          )}
        </div>
        <DeleteProjectButton
          projectId={id}
          projectName={project.name}
          variant="outline"
          size="sm"
          className="shrink-0 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
        />
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

      {/* Progress */}
      <ProjectProgress
        projectId={id}
        urlsCount={urls?.length ?? 0}
        scrapedCount={scrapedCount ?? 0}
        answersCount={answersCount ?? 0}
        recommendationsCount={recommendationsCount ?? 0}
      />

      {/* Analysis scores (depth + semantic coverage) */}
      {latestAnalysis && (
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Depth score</p>
            <p className="text-2xl font-bold text-foreground">
              {latestAnalysis.content_depth_score ?? "—"}/100
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Length & topic coverage vs competitors
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Semantic coverage</p>
            <p className="text-2xl font-bold text-foreground">
              {typeof latestAnalysis.competitor_coverage?.semantic_coverage === "number"
                ? `${latestAnalysis.competitor_coverage.semantic_coverage}%`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Topic overlap with AI answer (embedding-based)
            </p>
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
    </div>
  );
}
