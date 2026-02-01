// components/dashboard/ProjectCard.tsx
"use client";

import Link from "next/link";
import { Calendar, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {project.name}
        </h3>
        
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Target className="w-4 h-4" />
            <span className="truncate">{project.target_topic}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View Project →
          </span>
        </div>
      </div>
    </Link>
  );
}