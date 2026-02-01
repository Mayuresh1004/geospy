import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

// =========================
// GET - Single project with related data
// =========================
export async function GET(
  _request: NextRequest,
  { params }: RouteProps
) {
  try {
    const user = await requireAuth();

    // ✅ unwrap params ONCE
    const { id: projectId } = await params;

    // Get project
    const { data: project, error: projectError } = await db
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError) throw projectError;

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get related URLs
    const { data: urls } = await db
      .from("urls")
      .select("*")
      .eq("project_id", projectId);

    const urlIds = (urls ?? []).map((u) => u.id);

    // Get scraped content with URLs
    const { data: scrapedContent } = await db
      .from("scraped_content")
      .select(
        `
        *,
        urls (
          id,
          url,
          type,
          domain
        )
      `
      )
      .in("url_id", urlIds);

    // Get AI answers
    const { data: aiAnswers } = await db
      .from("ai_answers")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // Get latest analysis
    const { data: latestAnalysis } = await db
      .from("analysis_results")
      .select("*")
      .eq("project_id", projectId)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      project,
      urls: urls ?? [],
      scrapedContent: scrapedContent ?? [],
      aiAnswers: aiAnswers ?? [],
      latestAnalysis: latestAnalysis ?? null,
    });
  } catch (error) {
    console.error("[GET_PROJECT_ERROR]", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// =========================
// PATCH - Update project
// =========================
export async function PATCH(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const user = await requireAuth();
    const { id: projectId } = await params;

    const body = await request.json();
    const { name, description, target_topic } = body;

    const { data: project, error } = await db
      .from("projects")
      .update({
        name,
        description,
        target_topic,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ project });
  } catch (error) {
    console.error("[UPDATE_PROJECT_ERROR]", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// =========================
// DELETE - Delete project and related data
// =========================
export async function DELETE(
  _request: NextRequest,
  { params }: RouteProps
) {
  try {
    const user = await requireAuth();
    const { id: projectId } = await params;

    // Verify ownership
    const { data: project, error: projectError } = await db
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get URL ids for this project (for scraped_content)
    const { data: urls } = await db
      .from("urls")
      .select("id")
      .eq("project_id", projectId);
    const urlIds = (urls ?? []).map((u) => u.id);

    // Delete in order: recommendations → analysis_results → ai_answers → scraped_content → urls → project
    await db.from("recommendations").delete().eq("project_id", projectId);
    await db.from("analysis_results").delete().eq("project_id", projectId);
    await db.from("ai_answers").delete().eq("project_id", projectId);
    if (urlIds.length > 0) {
      await db.from("scraped_content").delete().in("url_id", urlIds);
    }
    await db.from("urls").delete().eq("project_id", projectId);

    const { error: deleteError } = await db
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_PROJECT_ERROR]", error);

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
