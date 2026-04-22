// app/(dashboard)/projects/new/page.tsx

import CreateProjectForm from "@/components/projects/CreateProjectForm";

export default function NewProjectPage() {
  return (
    <div className="w-full min-w-0">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-3">
          <div className="xl:sticky xl:top-8">
            <h1 className="text-3xl font-bold text-foreground">Create New Project</h1>
            <p className="text-muted-foreground mt-2">
              Set up a new GEO optimization project
            </p>
          </div>
        </div>

        <div className="xl:col-span-9 w-full min-w-0">
          <CreateProjectForm />
        </div>
      </div>
    </div>
  );
}