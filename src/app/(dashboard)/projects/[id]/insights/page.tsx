import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import GenerateAnswerForm from "@/components/projects/GenerateAnswerForm";
import AIAnswerCard from "@/components/projects/AIAnswerCard";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InsightsPage({
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


  const { data: aiAnswers } = await db
    .from("ai_answers")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

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
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            AI Insights
          </h1>
        </div>
        <p className="text-gray-600">
          View how generative AI responds to your target topics
        </p>
      </div>

      {/* Generate New Answer */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Generate New Answer
        </h2>
        <GenerateAnswerForm projectId={projectId} />
      </div>

      {/* AI Answers List */}
      {aiAnswers && aiAnswers.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Generated Answers ({aiAnswers.length})
          </h2>
          {aiAnswers.map((answer) => (
            <AIAnswerCard
              key={answer.id}
              answer={answer}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No AI answers yet
          </h3>
          <p className="text-gray-600">
            Generate your first AI answer to see insights
          </p>
        </div>
      )}
    </div>
  );
}
