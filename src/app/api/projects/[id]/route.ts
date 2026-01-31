// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET - Get single project with related data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const projectId = params.id;

    // Get project
    const { data: project, error: projectError } = await db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError) throw projectError;
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get related URLs
    const { data: urls } = await db
      .from('urls')
      .select('*')
      .eq('project_id', projectId);

    // Get scraped content with URLs
    const { data: scrapedContent } = await db
      .from('scraped_content')
      .select(`
        *,
        urls (
          id,
          url,
          type,
          domain
        )
      `)
      .in('url_id', (urls || []).map(u => u.id));

    // Get AI answers
    const { data: aiAnswers } = await db
      .from('ai_answers')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Get latest analysis if exists
    const { data: latestAnalysis } = await db
      .from('analysis_results')
      .select('*')
      .eq('project_id', projectId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      project,
      urls: urls || [],
      scrapedContent: scrapedContent || [],
      aiAnswers: aiAnswers || [],
      latestAnalysis: latestAnalysis || null,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, target_topic } = body;

    const { data: project, error } = await db
      .from('projects')
      .update({
        name,
        description,
        target_topic,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const { error } = await db
      .from('projects')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}