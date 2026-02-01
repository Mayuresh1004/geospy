// components/projects/AnalyzeButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";

interface AnalyzeButtonProps {
  projectId: string;
}

export default function AnalyzeButton({ projectId }: AnalyzeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");

    try {
      // Get the first AI answer
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectResponse.json();

      if (!projectData.aiAnswers || projectData.aiAnswers.length === 0) {
        throw new Error("No AI answers to analyze");
      }

      // Analyze
      const response = await fetch(`/api/projects/${projectId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_answer_id: projectData.aiAnswers[0].id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <Button onClick={handleAnalyze} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Run Analysis
          </>
        )}
      </Button>
    </div>
  );
}