"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AnalysisResult {
    id: string;
    content_depth_score: number;
    competitor_coverage: {
        semantic_coverage?: number;
        total_competitors: number;
        avg_word_count: number;
    };
    topics_missing: string[];
    topics_weak: string[];
    recommendations?: any[];
    analyzed_at: string;
}

interface ExportReportButtonProps {
    project: {
        name: string;
        target_topic: string;
    };
    analysis: AnalysisResult;
}

export default function ExportReportButton({ project, analysis }: ExportReportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;

            // --- Header ---
            doc.setFillColor(24, 24, 27); // Dark background (zinc-950)
            doc.rect(0, 0, pageWidth, 40, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("GEO Optimization Report", margin, 20);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(200, 200, 200);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, 32);

            const titleY = 60;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(project.name, margin, titleY);

            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`Target Topic: ${project.target_topic}`, margin, titleY + 8);

            // --- Scores ---
            const scoreY = 90;
            const boxWidth = 80;
            const boxHeight = 40;

            // Depth Score Box
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(245, 245, 250);
            doc.roundedRect(margin, scoreY, boxWidth, boxHeight, 3, 3, "FD");
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text("Content Depth Score", margin + 10, scoreY + 12);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(60, 60, 200); // Blue
            doc.text(`${analysis.content_depth_score}/100`, margin + 10, scoreY + 30);

            // Coverage Score Box
            doc.setFillColor(245, 245, 250);
            doc.roundedRect(margin + boxWidth + 10, scoreY, boxWidth, boxHeight, 3, 3, "FD");
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text("Semantic Coverage", margin + boxWidth + 20, scoreY + 12);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(140, 60, 200); // Purple
            doc.text(`${analysis.competitor_coverage.semantic_coverage || 0}%`, margin + boxWidth + 20, scoreY + 30);

            // --- Competitor Analysis ---
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("Competitor Gap Analysis", margin, 150);

            const missing = analysis.topics_missing.slice(0, 10);
            const weak = analysis.topics_weak.slice(0, 10);

            const tableData = [];
            if (missing.length) tableData.push([{ content: "Missing Topics (Critical)", colSpan: 1, styles: { fontStyle: 'bold', fillColor: [255, 230, 230] } }]);
            missing.forEach(t => tableData.push([`• ${t}`]));

            if (weak.length) {
                tableData.push([{ content: "Weak Coverage (Improvement Needed)", colSpan: 1, styles: { fontStyle: 'bold', fillColor: [255, 250, 230] } }]);
                weak.forEach(t => tableData.push([`• ${t}`]));
            }

            if (tableData.length === 0) {
                tableData.push(["No significant gaps found."]);
            }

            autoTable(doc, {
                startY: 160,
                head: [['Topic Analysis']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [50, 50, 50] },
            });

            // --- Footer ---
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${i} of ${pageCount} - GEOspy Optimization Report`, margin, doc.internal.pageSize.height - 10);
            }

            doc.save(`GEO-Report-${project.name.replace(/\s+/g, '-')}.pdf`);

        } catch (err) {
            console.error("PDF Export failed", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
        >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {isExporting ? "Generating..." : "Export PDF Report"}
        </Button>
    );
}
