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
    },
    medium: {
      color: "yellow" as const,
      icon: Info,
      label: "Medium Priority",
    },
    low: {
      color: "blue" as const,
      icon: Info,
      label: "Low Priority",
    },
  };

  const config = priorityConfig[recommendation.priority];
  const Icon = config.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`w-5 h-5 text-${config.color}-600`} />
              <h3 className="font-semibold text-gray-900 text-lg">
                {recommendation.title}
              </h3>
            </div>
            <p className="text-gray-700 mb-3">{recommendation.description}</p>
            
            <div className="flex gap-2">
              <Badge color={config.color}>{config.label}</Badge>
              <Badge color="gray">
                {recommendation.category.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className={`mt-6 ${!expanded && recommendation.action_items.length > 3 ? "max-h-48 overflow-hidden relative" : ""}`}>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Action Items
          </h4>
          <div className="space-y-3">
            {recommendation.action_items.map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">{item.action}</p>
                  <span className="text-xs text-gray-500 mt-1 inline-block">
                    Format: {item.format}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {!expanded && recommendation.action_items.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>

        {recommendation.action_items.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
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
      <div className="bg-green-50 border-t border-green-200 p-4">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-700 text-xs">✓</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-900 mb-1">
              Expected Impact
            </h4>
            <p className="text-sm text-green-700">
              {recommendation.expected_impact}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}