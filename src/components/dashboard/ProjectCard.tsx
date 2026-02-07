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
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="block h-full">
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 group">
        <CardHeader>
          <CardTitle className="group-hover:text-primary transition-colors">{project.name}</CardTitle>
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