// components/projects/RecommendationCard.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Info, Loader2, Sparkles, Copy } from "lucide-react";
import Badge from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
      containerClass: "border-red-500/20 bg-red-500/5 hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]",
      itemBg: "bg-red-500/10 text-red-500",
      badgeColor: "red" as const,
    },
    medium: {
      color: "yellow" as const,
      icon: Info,
      label: "Medium Priority",
      containerClass: "border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/40 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)]",
      itemBg: "bg-yellow-500/10 text-yellow-500",
      badgeColor: "yellow" as const,
    },
    low: {
      color: "blue" as const,
      icon: Info,
      label: "Low Priority",
      containerClass: "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]",
      itemBg: "bg-blue-500/10 text-blue-500",
      badgeColor: "blue" as const,
    },
  };

  const config = priorityConfig[recommendation.priority];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl border backdrop-blur-sm transition-all duration-300", config.containerClass)}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("p-2 rounded-lg bg-background/50 border border-white/5", config.itemBg)}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground text-lg tracking-tight">
                {recommendation.title}
              </h3>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">{recommendation.description}</p>

            <div className="flex gap-2">
              <Badge color={config.badgeColor}>{config.label}</Badge>
              <Badge variant="secondary" className="bg-background/50 border-white/10 text-foreground/80">
                {recommendation.category.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className={`mt-6 ${!expanded && recommendation.action_items.length > 3 ? "max-h-48 overflow-hidden relative" : ""}`}>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-500" />
            Action Items
          </h4>
          <div className="space-y-3">
            {recommendation.action_items.map((item, index) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-background/30 border border-white/5 hover:border-white/10 transition-colors">
                <div className={cn("flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-inset", config.itemBg)}>
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm leading-relaxed">{item.action}</p>
                  <span className="text-xs text-muted-foreground mt-1 inline-block px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                    Format: {item.format}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!expanded && recommendation.action_items.length > 3 && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/80 to-transparent backdrop-blur-[2px]" />
          )}
        </div>

        {recommendation.action_items.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm text-brand-500 hover:text-brand-400 font-medium flex items-center gap-1 transition-colors group"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              </>
            ) : (
              <>
                Show all {recommendation.action_items.length} steps{" "}
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Footer: Impact & Actions */}
      <div className="bg-white/5 border-t border-white/5 p-5 rounded-b-xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0 border border-green-500/20">
            <span className="text-green-500 text-xs font-bold">✓</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-0.5">Expected Impact</h4>
            <p className="text-sm text-muted-foreground">{recommendation.expected_impact}</p>
          </div>
        </div>

        {/* USP: Auto-Draft Button */}
        {(recommendation.category === 'missing_content' || recommendation.title.includes('Add')) && (
          <button
            onClick={handleDraft}
            disabled={isDrafting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isDrafting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
            )}
            {isDrafting ? 'Drafting...' : 'Auto-Draft Content'}
          </button>
        )}
      </div>

      {/* Draft Result Modal */}
      {showDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-background/95 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden ring-1 ring-white/10">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <div className="p-1.5 rounded bg-brand-500/10 border border-brand-500/20">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                </div>
                Drafted Content: <span className="text-foreground/80 font-normal">{recommendation.title}</span>
              </h3>
              <button onClick={() => setShowDraft(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-white/10 rounded-full">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-sm bg-muted/20 inner-shadow">
              <pre className="whitespace-pre-wrap text-foreground/90 font-sans leading-relaxed">{draftContent}</pre>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-muted/5">
              <button
                onClick={() => setShowDraft(false)}
                className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all"
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