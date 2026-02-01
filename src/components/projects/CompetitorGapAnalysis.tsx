"use client";

import { Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface AnalysisResult {
    topics_missing: string[];
    topics_weak: string[];
    competitor_coverage: {
        total_competitors: number;
        avg_word_count: number;
    };
}

interface CompetitorGapAnalysisProps {
    analysis: AnalysisResult;
}

export default function CompetitorGapAnalysis({ analysis }: CompetitorGapAnalysisProps) {
    const missingTopics = analysis.topics_missing || [];
    const weakTopics = analysis.topics_weak || [];

    if (missingTopics.length === 0 && weakTopics.length === 0) {
        return (
            <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded bg-green-500/10 border border-green-500/20">
                        <Sparkles className="w-4 h-4 text-green-500" />
                    </div>
                    Competitor Gap Analysis
                </h3>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-foreground font-medium">No significant gaps found!</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Your content covers all major topics found in competitor content. Great job!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow h-full">
            <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    Competitor Gap Analysis
                </h3>
                <p className="text-xs text-muted-foreground mt-1 ml-9">
                    Topics your competitors cover that you are missing or weak on.
                </p>
            </div>

            <div className="space-y-6">
                {/* Critical Gaps (Missing) */}
                {missingTopics.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Critical Gaps (Missing)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {missingTopics.slice(0, 10).map((topic, i) => (
                                <Badge key={i} color="red" className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-300 transition-colors cursor-default">
                                    {topic}
                                </Badge>
                            ))}
                            {missingTopics.length > 10 && (
                                <span className="text-xs text-muted-foreground self-center">
                                    +{missingTopics.length - 10} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Weak Coverage */}
                {weakTopics.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-500 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                            Weak Coverage
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {weakTopics.slice(0, 10).map((topic, i) => (
                                <Badge key={i} color="yellow" className="px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-300 transition-colors cursor-default">
                                    {topic}
                                </Badge>
                            ))}
                            {weakTopics.length > 10 && (
                                <span className="text-xs text-muted-foreground self-center">
                                    +{weakTopics.length - 10} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
