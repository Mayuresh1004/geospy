// app/api/projects/[id]/generate-answer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const projectId = params.id;
    const body = await request.json();
    const { queries } = body;

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        { error: 'queries must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log(`Generating answers for ${queries.length} queries...`);

    const results = [];

    for (const query of queries) {
      try {
        console.log(`Query: "${query}"`);
        
        // Call Gemini API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response from Gemini API');
        }
        
        const answer = data.candidates[0].content.parts[0].text;

        // Classify answer format
        const format = classifyAnswerFormat(answer);

        // Extract key concepts
        const concepts = await extractKeyConcepts(answer);

        console.log(`Answer generated:`, {
          format,
          length: answer.length,
          topics: concepts.topics.length,
          entities: concepts.entities.length,
        });

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
              model: 'gemini-1.5-flash',
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

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`Answer generation complete: ${successCount} succeeded, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: queries.length,
        succeeded: successCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error('Error in generate-answer route:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
    const prompt = `Extract key topics and named entities from this text. Return ONLY a valid JSON object with no markdown formatting, no backticks, no explanation:
{
  "topics": ["topic1", "topic2"],
  "entities": ["entity1", "entity2"]
}

Text: ${answer.substring(0, 2000)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    if (!response.ok) {
      throw new Error('Failed to extract concepts');
    }

    const data = await response.json();
    let result = data.candidates[0].content.parts[0].text;
    
    // Clean up response (remove markdown code blocks if present)
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(result);
    
    return {
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
    };
  } catch (error) {
    console.error('Error extracting concepts:', error);
    // Return empty arrays if extraction fails
    return { topics: [], entities: [] };
  }
}