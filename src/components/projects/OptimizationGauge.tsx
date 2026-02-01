"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizationGaugeProps {
    score: number;
    label: string;
    description?: string;
    size?: number;
    strokeWidth?: number;
    color?: string; // e.g. "text-brand-500"
}

export default function OptimizationGauge({
    score,
    label,
    description,
    size = 120,
    strokeWidth = 10,
    color = "text-brand-500",
}: OptimizationGaugeProps) {
    const [percent, setPercent] = useState(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percent / 100) * circumference;

    useEffect(() => {
        // Animate to score on mount
        const timer = setTimeout(() => setPercent(score), 100);
        return () => clearTimeout(timer);
    }, [score]);

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-500 group w-full h-full min-h-[220px]">
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                {/* Background Circle */}
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        className="text-muted/20"
                        strokeWidth={strokeWidth}
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    {/* Progress Circle */}
                    <circle
                        className={cn("transition-all duration-1000 ease-out", color)}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
                    <span className="text-3xl font-bold tracking-tighter text-foreground">
                        {percent}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground uppercase opacity-75">
                        / 100
                    </span>
                </div>
            </div>

            <div className="mt-4 text-center">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-500 transition-colors">
                    {label}
                </h3>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-[150px]">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
