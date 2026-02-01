
"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, X, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimulatorProps {
    projectId: string;
}

export default function Simulator({ projectId }: SimulatorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ original: string; simulated: string } | null>(null);

    const handleSimulate = async () => {
        setIsLoading(true);
        setIsOpen(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/simulate`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.success) {
                setResult(data);
            }
        } catch (error) {
            console.error("Simulation failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                onClick={handleSimulate}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 animate-pulse hover:animate-none transition-all duration-300 transform hover:-translate-y-0.5"
                size="lg"
            >
                <Zap className="w-4 h-4 mr-2" />
                Simulate Future Impact
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-background/95 backdrop-blur-xl w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300 ring-1 ring-white/5">

                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">GEO Impact Simulator</span>
                                </h2>
                                <p className="text-muted-foreground mt-1 ml-11">Visualize how your changes will alter AI answers.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                            {isLoading && !result ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full animate-pulse"></div>
                                        <Loader2 className="w-12 h-12 animate-spin text-brand-500 mb-4 relative z-10" />
                                    </div>
                                    <p className="text-lg font-medium animate-pulse text-foreground">Generating simulation...</p>
                                    <p className="text-sm text-muted-foreground mt-2">Re-indexing content with applied recommendations</p>
                                </div>
                            ) : null}

                            {/* BEFORE */}
                            <div className="flex-1 p-6 overflow-y-auto border-r border-white/10 bg-muted/5">
                                <div className="mb-6 flex items-center gap-2">
                                    <div className="bg-muted px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-muted-foreground border border-white/5">
                                        Current Reality
                                    </div>
                                </div>
                                {result ? (
                                    <div className="prose dark:prose-invert max-w-none opacity-80 pl-2 border-l-2 border-muted">
                                        <p className="whitespace-pre-wrap leading-relaxed">{result.original}</p>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground italic">
                                        Waiting for simulation...
                                    </div>
                                )}
                            </div>

                            {/* AFTER */}
                            <div className="flex-1 p-6 overflow-y-auto bg-brand-500/[0.02] relative">
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="bg-brand-500/10 text-brand-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-brand-500/20">
                                        <Sparkles className="w-3 h-3" /> Predicted Future
                                    </div>
                                    {result && <span className="text-xs text-brand-500 font-medium flex items-center gap-1">✨ Optimized with your changes</span>}
                                </div>
                                {result ? (
                                    <div className="prose dark:prose-invert max-w-none pl-2 border-l-2 border-brand-500/50">
                                        <p className="whitespace-pre-wrap leading-relaxed">{result.simulated}</p>
                                    </div>
                                ) : null}
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 bg-muted/5 flex justify-end">
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Close Simulator</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
