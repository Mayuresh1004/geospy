// components/dashboard/ProjectsList.tsx

import ProjectCard from "./ProjectCard";

interface Project {
  id: string;
  name: string;
  description?: string;
  target_topic: string;
  created_at: string;
  updated_at: string;
}

interface ProjectsListProps {
  projects: Project[];
}

export default function ProjectsList({ projects }: ProjectsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}