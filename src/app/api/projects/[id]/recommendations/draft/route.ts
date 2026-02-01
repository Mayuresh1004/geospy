
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateText } from '@/lib/gemini';

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
        const { recommendation } = body;

        if (!recommendation) {
            return NextResponse.json({ error: 'Recommendation data required' }, { status: 400 });
        }

        const { data: project } = await db
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const topic = recommendation.title.replace('Add section on ', '').replace('Expand coverage of ', '').replace(/"/g, '');
        const context = recommendation.description;
        const keywords = recommendation.action_items?.map((item: any) => item.action).join(', ') || '';

        const prompt = `
            You are an expert content writer for SEO and GEO (Generative Engine Optimization).
            Write a high-quality, authoritative section about "${topic}".
            
            Context: ${context}
            
            Requirements:
            - Length: 200-300 words.
            - Formatting: Use Markdown (H2, H3, bullet points) as appropriate.
            - Tone: Professional, informative, objective.
            - Keywords to include naturaly: ${keywords}
            - Structure: Start with a clear definition or direct answer, then expand with details/examples.
            
            Output only the markdown content. Do not include introductory text like "Here is the draft".
        `;

        const draftContent = await generateText(prompt);

        return NextResponse.json({
            success: true,
            draft: draftContent
        });

    } catch (error) {
        console.error('Draft generation error:', error);
        return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
    }
}
