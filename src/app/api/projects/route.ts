// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET - List all projects for user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { data: projects, error } = await db
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, target_topic, target_urls, competitor_urls } = body;

    // Validate input
    if (!name || !target_topic || !target_urls || target_urls.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, target_topic, and at least one target URL' },
        { status: 400 }
      );
    }

    // Create project
    const { data: project, error: projectError } = await db
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description,
        target_topic,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Add target URLs
    const urlsToInsert = [
      ...target_urls.map((url: string) => ({
        project_id: project.id,
        url: url.trim(),
        type: 'target',
        domain: extractDomain(url),
      })),
      ...(competitor_urls || []).map((url: string) => ({
        project_id: project.id,
        url: url.trim(),
        type: 'competitor',
        domain: extractDomain(url),
      })),
    ];

    const { error: urlsError } = await db
      .from('urls')
      .insert(urlsToInsert);

    if (urlsError) throw urlsError;

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// Helper function
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return '';
  }
}