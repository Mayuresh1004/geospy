// app/(dashboard)/projects/new/page.tsx

import CreateProjectForm from "@/components/projects/CreateProjectForm";

export default function NewProjectPage() {
  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create New Project</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new GEO optimization project
        </p>
      </div>

      <CreateProjectForm />
    </div>
  );
}