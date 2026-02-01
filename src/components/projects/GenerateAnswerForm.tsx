// components/projects/GenerateAnswerForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";

interface GenerateAnswerFormProps {
  projectId: string;
}

export default function GenerateAnswerForm({
  projectId,
}: GenerateAnswerFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState("");

  const handleEnhance = async () => {
    const q = query.trim();
    if (!q) {
      setError("Enter a query first to enhance.");
      return;
    }
    setEnhancing(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/enhance-query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to enhance query");
      if (data.enhanced_query) setQuery(data.enhanced_query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance query");
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/generate-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: [query.trim()],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate answer");
      }

      setQuery("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}



      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a question or topic (e.g. Top 5 best Mobiles under ₹30k)"
            className="flex-1"
            required
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleEnhance}
            disabled={enhancing || !query.trim()}
            title="Improve this query for better AI answers"
          >
            {enhancing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5 text-purple-600 dark:text-purple-400" />
                Enhance
              </>
            )}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Answer"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Use &quot;Enhance&quot; to turn your query into a clearer question for better AI answers.
        </p>
      </div>
    </form>
  );
}
