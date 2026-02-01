// components/projects/RecommendationCard.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface RecommendationCardProps {
  recommendation: {
    id: string;
    priority: "high" | "medium" | "low";
    category: string;
    title: string;
    description: string;
    action_items: Array<{
      step: number;
      action: string;
      format: string;
    }>;
    expected_impact: string;
  };
}

export default function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const priorityConfig = {
    high: {
      color: "red" as const,
      icon: AlertTriangle,
      label: "High Priority",
      containerClass: "bg-red-500/5 border-red-500/20 hover:border-red-500/40",
      itemBg: "bg-red-500/10 text-red-700 dark:text-red-400",
    },
    medium: {
      color: "yellow" as const,
      icon: Info,
      label: "Medium Priority",
      containerClass: "bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40",
      itemBg: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    },
    low: {
      color: "blue" as const,
      icon: Info,
      label: "Low Priority",
      containerClass: "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40",
      itemBg: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    },
  };

  const config = priorityConfig[recommendation.priority];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border transition-all duration-300 ${config.containerClass}`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`w-5 h-5 text-${config.color}-600 dark:text-${config.color}-400`} />
              <h3 className="font-semibold text-foreground text-lg">
                {recommendation.title}
              </h3>
            </div>
            <p className="text-muted-foreground mb-3">{recommendation.description}</p>

            <div className="flex gap-2">
              <Badge color={config.color}>{config.label}</Badge>
              <Badge variant="secondary">
                {recommendation.category.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className={`mt-6 ${!expanded && recommendation.action_items.length > 3 ? "max-h-48 overflow-hidden relative" : ""}`}>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Action Items
          </h4>
          <div className="space-y-3">
            {recommendation.action_items.map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${config.itemBg}`}>
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="text-foreground">{item.action}</p>
                  <span className="text-xs text-muted-foreground mt-1 inline-block">
                    Format: {item.format}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!expanded && recommendation.action_items.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
          )}
        </div>

        {recommendation.action_items.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show all {recommendation.action_items.length} steps{" "}
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Expected Impact */}
      <div className="bg-muted/30 border-t border-border p-4 rounded-b-xl">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">
              Expected Impact
            </h4>
            <p className="text-sm text-muted-foreground">
              {recommendation.expected_impact}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}