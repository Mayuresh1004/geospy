"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";

interface AnalysisResult {
    id: string;
    content_depth_score: number;
    competitor_coverage: {
        semantic_coverage?: number;
    };
    analyzed_at: string;
}

interface HistoryChartProps {
    data: AnalysisResult[];
}

export default function HistoryChart({ data }: HistoryChartProps) {
    // Sort data by date ascending
    const sortedData = [...data].sort(
        (a, b) =>
            new Date(a.analyzed_at).getTime() - new Date(b.analyzed_at).getTime()
    );

    const chartData = sortedData.map((item) => ({
        date: item.analyzed_at,
        depth: item.content_depth_score,
        coverage: item.competitor_coverage?.semantic_coverage || 0,
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 backdrop-blur-sm border border-white/10 p-3 rounded-lg shadow-xl text-sm">
                    <p className="font-medium mb-2 text-foreground">
                        {format(new Date(label), "MMM d, yyyy h:mm a")}
                    </p>
                    <div className="space-y-1">
                        <p className="flex items-center gap-2 text-brand-500">
                            <span className="w-2 h-2 rounded-full bg-brand-500" />
                            Depth Score: <span className="font-bold">{payload[0].value}</span>
                        </p>
                        <p className="flex items-center gap-2 text-indigo-500">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            Semantic Coverage:{" "}
                            <span className="font-bold">{payload[1].value}%</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (chartData.length < 2) {
        return (
            <div className="w-full h-[300px] flex flex-col items-center justify-center bg-muted/5 border border-white/5 rounded-2xl">
                <Sparkles className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">History will appear here</p>
                <p className="text-xs text-muted-foreground mt-1 opacity-70">Run more analyses to see trends</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[350px] bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded bg-brand-500/10 border border-brand-500/20">
                        <Sparkles className="w-4 h-4 text-brand-500" />
                    </div>
                    Optimization History
                </h3>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <defs>
                        <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), "MMM d")}
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                        type="monotone"
                        dataKey="depth"
                        name="Depth Score"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                    />
                    <Line
                        type="monotone"
                        dataKey="coverage"
                        name="Semantic Coverage"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
