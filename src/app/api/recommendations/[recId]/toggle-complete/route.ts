import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteProps {
  params: Promise<{ recId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const user = await requireAuth();
    const { recId } = await params;

    const body = await request.json().catch(() => ({}));
    const is_completed =
      typeof body?.is_completed === "boolean" ? body.is_completed : null;

    if (!recId) {
      return NextResponse.json({ error: "Invalid recommendation id" }, { status: 400 });
    }
    if (is_completed === null) {
      return NextResponse.json({ error: "is_completed must be boolean" }, { status: 400 });
    }

    const { data: rec, error: recErr } = await db
      .from("recommendations")
      .select("id, project_id")
      .eq("id", recId)
      .single();

    if (recErr || !rec) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    const { data: project } = await db
      .from("projects")
      .select("id")
      .eq("id", rec.project_id)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: updated, error } = await db
      .from("recommendations")
      .update({ is_completed })
      .eq("id", recId)
      .select("id, is_completed")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, recommendation: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to toggle completion" },
      { status: 500 }
    );
  }
}

