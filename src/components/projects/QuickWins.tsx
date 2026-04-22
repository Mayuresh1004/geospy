"use client";

import RecommendationCard from "@/components/projects/RecommendationCard";

export default function QuickWins({
  recommendations,
}: {
  recommendations: Array<any>;
}) {
  const quick = (recommendations ?? []).filter(
    (r) => r.category === "format" && r.priority === "medium"
  );

  if (quick.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Quick Wins</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Medium-priority format tweaks that are usually fast to implement.
      </p>
      <div className="space-y-4">
        {quick.slice(0, 3).map((rec) => (
          <RecommendationCard key={rec.id} recommendation={rec} />
        ))}
      </div>
    </div>
  );
}

