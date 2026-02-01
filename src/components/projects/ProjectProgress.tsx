// components/projects/ProjectProgress.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProjectProgressProps {
  projectId: string;
  urlsCount: number;
  scrapedCount: number;
  answersCount: number;
  recommendationsCount: number;
}

export default function ProjectProgress({
  projectId,
  urlsCount,
  scrapedCount,
  answersCount,
  recommendationsCount,
}: ProjectProgressProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const steps = [
    {
      id: "scrape",
      title: "Scrape Content",
      description: `Analyze ${urlsCount} URLs`,
      completed: scrapedCount > 0,
      count: `${scrapedCount}/${urlsCount}`,
      disabled: false,
    },
    {
      id: "generate",
      title: "Generate AI Answers",
      description: "Query generative AI",
      completed: answersCount > 0,
      count: answersCount > 0 ? `${answersCount} generated` : "Not started",
      disabled: scrapedCount === 0,
    },
    {
      id: "analyze",
      title: "Analyze & Compare",
      description: "Generate insights",
      completed: recommendationsCount > 0,
      count: recommendationsCount > 0 ? `${recommendationsCount} recommendations` : "Not started",
      disabled: answersCount === 0,
    },
  ];

  const handleScrape = async () => {
    setLoading("scrape");
    setError("");
    
    try {
      const response = await fetch(`/api/projects/${projectId}/scrape`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape content");
      }
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateAnswers = async () => {
    setLoading("generate");
    setError("");
    
    try {
      // Get project details to use target_topic
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectResponse.json();
      
      if (!projectData.project) {
        throw new Error("Failed to load project data");
      }

      const response = await fetch(`/api/projects/${projectId}/generate-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: [projectData.project.target_topic], // Use the target topic
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate answers");
      }
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const handleAnalyze = async () => {
    setLoading("analyze");
    setError("");
    
    try {
      // Get the latest AI answer to analyze
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectResponse.json();
      
      if (!projectData.aiAnswers || projectData.aiAnswers.length === 0) {
        throw new Error("No AI answers to analyze. Please generate AI answers first.");
      }
      
      // Use the most recent AI answer
      const latestAnswer = projectData.aiAnswers[0];
      
      const response = await fetch(`/api/projects/${projectId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_answer_id: latestAnswer.id,
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
      setLoading(null);
    }
  };

  const handleStepClick = (stepId: string) => {
    if (stepId === "scrape") handleScrape();
    else if (stepId === "generate") handleGenerateAnswers();
    else if (stepId === "analyze") handleAnalyze();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground mb-6">Project Progress</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border"
          >
            <div className="flex items-center gap-4">
              {step.completed ? (
                <CheckCircle2 className="w-6 h-6 text-chart-2 shrink-0" />
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground shrink-0" />
              )}
              <div>
                <h3 className="font-medium text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{step.count}</p>
              </div>
            </div>

            {!step.completed && (
              <Button
                size="sm"
                onClick={() => handleStepClick(step.id)}
                disabled={loading !== null || step.disabled}
                className="shrink-0"
              >
                {loading === step.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            )}
            
            {step.completed && (
              <span className="text-sm text-chart-2 font-medium shrink-0">✓ Complete</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
        <p className="text-sm text-primary">
          <strong>Tip:</strong> Complete steps in order. Each step requires the previous one to finish.
        </p>
      </div>
    </div>
  );
}