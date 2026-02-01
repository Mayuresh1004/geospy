
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
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg animate-pulse hover:animate-none transition-all"
                size="lg"
            >
                <Zap className="w-4 h-4 mr-2" />
                Simulate Future Impact
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border/50 animate-in zoom-in-95 duration-300">

                        {/* Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-amber-500" />
                                    GEO Impact Simulator
                                </h2>
                                <p className="text-muted-foreground">Visualize how your changes will alter AI answers.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                            {isLoading && !result ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 z-10">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                                    <p className="text-lg font-medium animate-pulse">Consulting the Oracle...</p>
                                    <p className="text-sm text-muted-foreground">Re-indexing content with applied recommendations</p>
                                </div>
                            ) : null}

                            {/* BEFORE */}
                            <div className="flex-1 p-6 overflow-y-auto border-r border-border bg-muted/10">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="bg-gray-500/20 text-gray-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Current Reality
                                    </div>
                                </div>
                                {result ? (
                                    <div className="prose dark:prose-invert max-w-none opacity-70">
                                        <p className="whitespace-pre-wrap leading-relaxed">{result.original}</p>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">Waiting for simulation...</div>
                                )}
                            </div>

                            {/* AFTER */}
                            <div className="flex-1 p-6 overflow-y-auto bg-green-500/5 relative">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="bg-green-500/20 text-green-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Predicted Future
                                    </div>
                                    {result && <span className="text-xs text-green-600 font-medium">✨ Optimized with your changes</span>}
                                </div>
                                {result ? (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p className="whitespace-pre-wrap leading-relaxed">{result.simulated}</p>
                                    </div>
                                ) : null}
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
                            <Button onClick={() => setIsOpen(false)}>Close Simulator</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
