import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteProps
) {
  try {
    const { id: userId } = await requireAuth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ unwrap params ONCE
    const { id: projectId } = await params;

    // =========================
    // Verify project ownership
    // =========================
    const { data: project } = await db
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // =========================
    // Fetch recommendations
    // =========================
    const { data: recommendations, error } = await db
      .from("recommendations")
      .select("*")
      .eq("project_id", projectId)
      .order("priority", { ascending: true }) // high → medium → low
      .order("created_at", { ascending: false });

    if (error) throw error;

    const grouped = {
      high:
        recommendations?.filter(
          (r) => r.priority === "high"
        ) ?? [],
      medium:
        recommendations?.filter(
          (r) => r.priority === "medium"
        ) ?? [],
      low:
        recommendations?.filter(
          (r) => r.priority === "low"
        ) ?? [],
    };

    return NextResponse.json({
      recommendations: recommendations ?? [],
      grouped,
      total: recommendations?.length ?? 0,
    });
  } catch (error) {
    console.error(
      "[GET_RECOMMENDATIONS_ERROR]",
      error
    );

    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
