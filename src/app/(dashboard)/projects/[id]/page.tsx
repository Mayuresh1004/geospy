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

  const targetUrls = urls?.filter((u) => u.type === "target") ?? [];
  const competitorUrls = urls?.filter((u) => u.type === "competitor") ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-gray-600 mt-2">
              {project.description}
            </p>
          )}
        </div>
        <DeleteProjectButton
          projectId={id}
          projectName={project.name}
          variant="outline"
          size="sm"
          className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        />
      </div>

      {/* Target Topic */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
        <Target className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">
            Target Topic
          </p>
          <p className="text-blue-700 mt-1">
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

      {/* URLs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Target URLs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your URLs ({targetUrls.length})
          </h3>
          <div className="space-y-2">
            {targetUrls.map((url) => (
              <div
                key={url.id}
                className="text-sm text-gray-600 truncate bg-gray-50 px-3 py-2 rounded"
              >
                {url.url}
              </div>
            ))}
          </div>
        </div>

        {/* Competitor URLs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Competitor URLs ({competitorUrls.length})
          </h3>
          {competitorUrls.length > 0 ? (
            <div className="space-y-2">
              {competitorUrls.map((url) => (
                <div
                  key={url.id}
                  className="text-sm text-gray-600 truncate bg-gray-50 px-3 py-2 rounded"
                >
                  {url.url}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No competitor URLs added
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={`/projects/${id}/insights`}>
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    AI Insights
                  </h3>
                  <p className="text-sm text-gray-600">
                    View AI-generated answers
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        </Link>

        <Link href={`/projects/${id}/recommendations`}>
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Recommendations
                  </h3>
                  <p className="text-sm text-gray-600">
                    {recommendationsCount ?? 0} actionable insights
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
