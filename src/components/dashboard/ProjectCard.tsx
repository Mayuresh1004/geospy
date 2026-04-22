// components/dashboard/ProjectCard.tsx
"use client";

import Link from "next/link";
import { Calendar, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    target_topic: string;
    created_at: string;
    geo_score_total?: number | null;
  };
}

function geoScoreTone(score: number) {
  if (score < 40) return "bg-destructive/10 text-destructive border-destructive/20";
  if (score <= 70) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
  return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="block h-full">
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 group">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            {typeof project.geo_score_total === "number" ? (
              <span
                className={[
                  "shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                  geoScoreTone(project.geo_score_total),
                ].join(" ")}
              >
                GEO {project.geo_score_total}
              </span>
            ) : null}
          </div>
          {project.description && (
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4 text-primary" />
              <span className="truncate font-medium">{project.target_topic}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
            </span>
          </div>
          <span className="text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View Project →
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}