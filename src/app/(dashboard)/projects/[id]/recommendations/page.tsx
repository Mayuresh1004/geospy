import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Target, AlertCircle } from "lucide-react";
import AnalyzeButton from "@/components/projects/AnalyzeButton";
import RecommendationCard from "@/components/projects/RecommendationCard";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecommendationsPage({
  params,
}: PageProps) {
  const user = await requireAuth();

  // ✅ unwrap params ONCE
  const { id: projectId } = await params;

  // =========================
  // Verify project ownership
  // =========================
  const { data: project } = await db
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    notFound();
  }

  // =========================
  // Fetch recommendations
  // =========================
  const { data: recommendations } = await db
    .from("recommendations")
    .select("*")
    .eq("project_id", projectId)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  // =========================
  // Check if AI answers exist
  // =========================
  const { data: aiAnswers } = await db
    .from("ai_answers")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);

  const hasAIAnswers = !!(aiAnswers && aiAnswers.length > 0);

  // =========================
  // Group recommendations
  // =========================
  const highPriority =
    recommendations?.filter((r) => r.priority === "high") ?? [];
  const mediumPriority =
    recommendations?.filter((r) => r.priority === "medium") ?? [];
  const lowPriority =
    recommendations?.filter((r) => r.priority === "low") ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Target className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Recommendations
          </h1>
        </div>
        <p className="text-gray-600">
          Actionable insights to improve your GEO performance
        </p>
      </div>

      {/* Analysis Trigger */}
      {hasAIAnswers && recommendations?.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Ready to Analyze
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                You have AI answers ready. Run analysis to
                generate recommendations.
              </p>
              <AnalyzeButton projectId={projectId} />
            </div>
          </div>
        </div>
      )}

      {/* No AI Answers Warning */}
      {!hasAIAnswers && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                No AI Answers Yet
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                Generate AI answers first to get
                recommendations.
              </p>
              <Link
                href={`/projects/${projectId}/insights`}
              >
                <Button size="sm">
                  Go to AI Insights
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 ? (
        <div className="space-y-8">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {highPriority.length}
              </div>
              <div className="text-sm text-gray-600">
                High Priority
              </div>
            </div>
            <div className="bg-white border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {mediumPriority.length}
              </div>
              <div className="text-sm text-gray-600">
                Medium Priority
              </div>
            </div>
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {lowPriority.length}
              </div>
              <div className="text-sm text-gray-600">
                Low Priority
              </div>
            </div>
          </div>

          {/* High */}
          {highPriority.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                🔴 High Priority
              </h2>
              <div className="space-y-4">
                {highPriority.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medium */}
          {mediumPriority.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                🟡 Medium Priority
              </h2>
              <div className="space-y-4">
                {mediumPriority.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Low */}
          {lowPriority.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                🔵 Low Priority
              </h2>
              <div className="space-y-4">
                {lowPriority.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : hasAIAnswers ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No Recommendations Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Run analysis to generate recommendations
          </p>
          <AnalyzeButton projectId={projectId} />
        </div>
      ) : null}
    </div>
  );
}
