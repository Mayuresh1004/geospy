// app/api/projects/[id]/generate-answer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: userId } = await requireAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;
    const body = await request.json();
    const { queries } = body; // Array of questions

    if (!queries || queries.length === 0) {
      return NextResponse.json(
        { error: 'No queries provided' },
        { status: 400 }
      );
    }

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

    const results = [];

    for (const query of queries) {
      try {
        // Call Gemini API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: query }]
              }]
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const answer = data.candidates[0].content.parts[0].text;

        // Classify answer format
        const format = classifyAnswerFormat(answer);

        // Extract key concepts
        const concepts = await extractKeyConcepts(answer);

        // Save to database
        const { data: aiAnswer, error: insertError } = await db
          .from('ai_answers')
          .insert({
            project_id: projectId,
            query,
            raw_answer: answer,
            answer_format: format,
            key_concepts: concepts.topics,
            entities: concepts.entities,
            metadata: {
              model: 'gemini-pro',
              timestamp: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (insertError) throw insertError;

        results.push({
          query,
          status: 'success',
          answer: aiAnswer,
        });
      } catch (error) {
        console.error(`Error generating answer for "${query}":`, error);
        results.push({
          query,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error in generate-answer route:', error);
    return NextResponse.json(
      { error: 'Failed to generate answers' },
      { status: 500 }
    );
  }
}

function classifyAnswerFormat(answer: string): string {
  // Check for numbered lists or steps
  if (/^\d+\.|^Step \d+/m.test(answer)) {
    return 'step_by_step';
  }
  
  // Check for bullet points
  if (/^[\*\-•]/m.test(answer)) {
    return 'bullet_list';
  }
  
  // Check for short definition
  if (answer.length < 200) {
    return 'definition';
  }
  
  return 'paragraph';
}

async function extractKeyConcepts(answer: string): Promise<{ topics: string[], entities: string[] }> {
  try {
    const prompt = `Extract key topics and entities from this text. Return ONLY valid JSON with no markdown formatting or backticks:
{
  "topics": ["topic1", "topic2"],
  "entities": ["entity1", "entity2"]
}

Text: ${answer}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const data = await response.json();
    let result = data.candidates[0].content.parts[0].text;
    
    // Clean up response (remove markdown code blocks if present)
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(result);
    return parsed;
  } catch (error) {
    console.error('Error extracting concepts:', error);
    // Return empty arrays if extraction fails
    return { topics: [], entities: [] };
  }
}