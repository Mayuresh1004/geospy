// app/(dashboard)/dashboard/page.tsx
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectsList from "@/components/dashboard/ProjectsList";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Fetch user's projects
  const { data: projects } = await db
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: analyses } = projectIds.length
    ? await db
        .from("analysis_results")
        .select("project_id, analyzed_at, geo_score_breakdown")
        .in("project_id", projectIds)
        .order("analyzed_at", { ascending: false })
    : { data: [] as Array<{ project_id: string; analyzed_at: string; geo_score_breakdown?: any }> };

  const latestScoreByProject = new Map<string, number>();
  for (const row of analyses ?? []) {
    if (latestScoreByProject.has(row.project_id)) continue;
    const total =
      row.geo_score_breakdown && typeof row.geo_score_breakdown === "object"
        ? (row.geo_score_breakdown as Record<string, unknown>).total
        : null;
    if (typeof total === "number") {
      latestScoreByProject.set(row.project_id, total);
    }
  }

  const projectsWithScores =
    (projects ?? []).map((p) => ({
      ...p,
      geo_score_total: latestScoreByProject.get(p.id) ?? null,
    })) ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your GEO optimization projects
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects List */}
      {projects && projects.length > 0 ? (
        <ProjectsList projects={projectsWithScores} />
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No projects yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first GEO project to get started
          </p>
          <Link href="/projects/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}