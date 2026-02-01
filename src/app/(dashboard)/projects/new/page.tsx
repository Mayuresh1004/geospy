// app/(dashboard)/projects/new/page.tsx

import CreateProjectForm from "@/components/projects/CreateProjectForm";

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-600 mt-2">
          Set up a new GEO optimization project
        </p>
      </div>

      <CreateProjectForm />
    </div>
  );
}