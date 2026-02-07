// components/projects/AIAnswerCard.tsx
"use client";

import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
  Hash
} from "lucide-react";
import Badge from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AIAnswerCardProps {
  answer: {
    id: string;
    query: string;
    raw_answer: string;
    answer_format: string;
    key_concepts: string[];
    entities: string[];
    created_at: string;
  };
}

/** Parse raw answer into list items when it looks like a list (numbered, bullet, or bold items). */
function parseAnswerContent(text: string): { type: "list"; items: string[] } | { type: "paragraph" } {
  const trimmed = text.trim();
  // Numbered list: "1. ... 2. ..." or "1) ... 2) ..."
  const numberedMatch = trimmed.match(/\d+[.)]\s+/g);
  if (numberedMatch && numberedMatch.length >= 2) {
    const items = trimmed
      .split(/\d+[.)]\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length >= 2) return { type: "list", items };
  }
  // Bold-item list: "**Item1**: desc. **Item2**: desc." (2+ items) — keep "**Name**: desc" per item
  const boldDelimiter = /\*\*[^*]+\*\*:\s*/g;
  const boldMatches = [...trimmed.matchAll(boldDelimiter)];
  if (boldMatches.length >= 2) {
    const parts = trimmed.split(/(\*\*[^*]+\*\*:\s*)/g).filter(Boolean);
    const items: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (/^\*\*[^*]+\*\*:\s*$/.test(parts[i])) {
        const desc = parts[i + 1] ?? "";
        items.push(parts[i].trim() + " " + desc.trim());
        i++;
      }
    }
    if (items.length >= 2) return { type: "list", items };
  }
  // Bullet list: lines starting with - • *
  const bulletLines = trimmed.split(/\n/).filter((line) => /^\s*[-•*]\s+/.test(line));
  if (bulletLines.length >= 2) {
    const items = bulletLines.map((line) => line.replace(/^\s*[-•*]\s+/, "").trim()).filter(Boolean);
    if (items.length >= 2) return { type: "list", items };
  }
  // Newline-separated list (one item per line, 2+ lines)
  const lines = trimmed.split(/\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length >= 2 && lines.every((l) => l.length > 10)) {
    return { type: "list", items: lines };
  }
  return { type: "paragraph" };
}

/** Render text with **bold** as <strong>. */
function renderWithBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground/90">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AIAnswerCard({ answer }: AIAnswerCardProps) {
  const [expanded, setExpanded] = useState(false);

  const parsed = useMemo(
    () => parseAnswerContent(answer.raw_answer),
    [answer.raw_answer]
  );

  const formatTypeColor = (format: string): "blue" | "green" | "purple" | "yellow" | "gray" | "red" => {
    const colors: Record<string, "blue" | "green" | "purple" | "yellow" | "gray" | "red"> = {
      paragraph: "blue",
      bullet_list: "green",
      step_by_step: "purple",
      definition: "yellow",
    };
    return colors[format] || "gray";
  };

  const isList = parsed.type === "list";
  const displayContent = isList ? (
    <ol className="list-decimal list-outside pl-6 space-y-2 text-foreground/80">
      {parsed.items.map((item, i) => (
        <li key={i} className="pl-1 leading-relaxed">
          {renderWithBold(item)}
        </li>
      ))}
    </ol>
  ) : (
    <div className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{renderWithBold(answer.raw_answer)}</div>
  );

  const clampClass = !expanded && answer.raw_answer.length > 300 ? "line-clamp-3" : "";

  return (
    <div className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm shadow-sm transition-all hover:border-brand-500/30">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-linear-to-b from-white/5 to-transparent">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-brand-500/10 text-brand-500">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">{answer.query}</h3>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground ml-9">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {formatDistanceToNow(new Date(answer.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>

          <Badge color={formatTypeColor(answer.answer_format)} className="shadow-sm">
            {answer.answer_format.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Answer body: list or paragraph */}
        <div className={`prose prose-sm dark:prose-invert max-w-none mt-4 ml-1 ${clampClass}`}>
          {displayContent}
        </div>

        {answer.raw_answer.length > 300 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 text-sm text-brand-500 hover:text-brand-400 font-medium flex items-center gap-1 transition-colors group"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="p-5 bg-muted/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Concepts */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Tag className="w-3.5 h-3.5" />
              Key Concepts
            </div>
            {answer.key_concepts && answer.key_concepts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {answer.key_concepts.map((concept, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-500/10 text-blue-400 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 px-2 py-0.5 text-xs"
                  >
                    {concept}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No concepts extracted</p>
            )}
          </div>

          {/* Entities */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Hash className="w-3.5 h-3.5" />
              Entities
            </div>
            {answer.entities && answer.entities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {answer.entities.map((entity, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-purple-500/10 text-purple-400 dark:text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 px-2 py-0.5 text-xs"
                  >
                    {entity}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No entities extracted</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}