// app/api/projects/[id]/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = await requireAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;

    // Verify project ownership
    const { data: project } = await db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all recommendations for this project
    const { data: recommendations, error } = await db
      .from('recommendations')
      .select('*')
      .eq('project_id', projectId)
      .order('priority', { ascending: true }) // high, medium, low
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by priority
    const grouped = {
      high: recommendations?.filter(r => r.priority === 'high') || [],
      medium: recommendations?.filter(r => r.priority === 'medium') || [],
      low: recommendations?.filter(r => r.priority === 'low') || [],
    };

    return NextResponse.json({
      recommendations: recommendations || [],
      grouped,
      total: recommendations?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}