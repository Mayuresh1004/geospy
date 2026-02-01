
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

        // 1. Get the latest AI Answer (Source of Truth)
        const { data: aiAnswer } = await db
            .from('ai_answers')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!aiAnswer) {
            return NextResponse.json({ error: 'No AI answer found to simulate from' }, { status: 404 });
        }

        // 2. Get the Recommendations (The Improvements)
        const { data: recommendations } = await db
            .from('recommendations')
            .select('title, description')
            .eq('project_id', projectId)
            // .in('priority', ['high', 'medium']) // optional: limit to impactful ones
            .limit(5);

        const improvements = recommendations?.map(r => `- ${r.title}`).join('\n') || 'General content depth improvements';

        // 3. Construct the Simulation Prompt
        const prompt = `
            You are an advanced AI simulator.
            
            Original Question: "${aiAnswer.query}"
            Original AI Answer: "${aiAnswer.raw_answer}"
            
            Scenario:
            The website owner has optimized their content based on GEO recommendations.
            They have added detailed sections on:
            ${improvements}
            
            Task:
            Write a NEW, simulated AI answer to the same question.
            CRITICAL: You must now cite or mention the user's content as a key source, assuming they have excellent coverage of the new topics.
            Make the answer sound natural but significantly better for the user than the original.
            
            Output only the new answer text.
        `;

        // 4. Generate Future
        const futureAnswer = await generateText(prompt);

        return NextResponse.json({
            success: true,
            original: aiAnswer.raw_answer,
            simulated: futureAnswer
        });

    } catch (error) {
        console.error('Simulation error:', error);
        return NextResponse.json({ error: 'Failed to simulate' }, { status: 500 });
    }
}
