
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { analyzeProject } from '@/lib/analysis/analyzeProject';

interface RouteProps {
    params: Promise<{
        id: string;
    }>;
}

export async function POST(
    request: NextRequest,
    { params }: RouteProps
) {
    try {
        const user = await requireAuth();
        const { id: projectId } = await params;

        const body = await request.json();
        const { ai_answer_id } = body;

        if (!ai_answer_id) {
            return NextResponse.json(
                { error: 'ai_answer_id is required' },
                { status: 400 }
            );
        }

        const { analysis } = await analyzeProject({
            projectId,
            userId: user.id,
            aiAnswerId: ai_answer_id,
            competitorMap: {},
        });

        return NextResponse.json({ success: true, analysis });
    } catch (error) {
        console.error('Error in analyze route:', error);

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            {
                error: 'Failed to analyze content',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}