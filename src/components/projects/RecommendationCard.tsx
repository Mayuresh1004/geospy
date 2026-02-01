// components/projects/RecommendationCard.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Info, Loader2, Sparkles, Copy } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface RecommendationCardProps {
  recommendation: {
    id: string;
    project_id: string;
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
  const [isDrafting, setIsDrafting] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  const handleDraft = async () => {
    setIsDrafting(true);
    try {
      const res = await fetch(`/api/projects/${recommendation.project_id}/recommendations/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation }),
      });
      const data = await res.json();
      if (data.success) {
        setDraftContent(data.draft);
        setShowDraft(true);
      }
    } catch (error) {
      console.error("Drafting failed", error);
    } finally {
      setIsDrafting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draftContent);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

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

      {/* Footer: Impact & Actions */}
      <div className="bg-muted/30 border-t border-border p-4 rounded-b-xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Expected Impact</h4>
            <p className="text-sm text-muted-foreground">{recommendation.expected_impact}</p>
          </div>
        </div>

        {/* USP: Auto-Draft Button */}
        {(recommendation.category === 'missing_content' || recommendation.title.includes('Add')) && (
          <button
            onClick={handleDraft}
            disabled={isDrafting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-md text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70"
          >
            {isDrafting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isDrafting ? 'Drafting...' : 'Auto-Draft Content'}
          </button>
        )}
      </div>

      {/* Draft Result Modal */}
      {showDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Drafted Content: {recommendation.title}
              </h3>
              <button onClick={() => setShowDraft(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-sm bg-muted/30 inner-shadow">
              <pre className="whitespace-pre-wrap text-foreground/90 font-sans">{draftContent}</pre>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/10 rounded-b-xl">
              <button
                onClick={() => setShowDraft(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                {hasCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {hasCopied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}