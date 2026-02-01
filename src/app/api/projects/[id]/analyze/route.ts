// app/api/projects/[id]/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db'; // Use existing db client

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

    // Verify project ownership
    const { data: project, error: projectError } = await db
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get AI answer
    const { data: aiAnswer, error: answerError } = await db
      .from('ai_answers')
      .select('*')
      .eq('id', ai_answer_id)
      .eq('project_id', projectId)
      .single();

    if (answerError || !aiAnswer) {
      return NextResponse.json({ error: 'AI answer not found' }, { status: 404 });
    }

    // Get all URLs for this project
    const { data: urls } = await db
      .from('urls')
      .select('id, type')
      .eq('project_id', projectId);

    if (!urls || urls.length === 0) {
      return NextResponse.json(
        { error: 'No URLs found for this project' },
        { status: 400 }
      );
    }

    // Get scraped content from competitors
    const competitorUrlIds = urls.filter(u => u.type === 'competitor').map(u => u.id);
    
    let competitors: any[] = [];
    if (competitorUrlIds.length > 0) {
      const { data: scrapedData } = await db
        .from('scraped_content')
        .select('*')
        .in('url_id', competitorUrlIds)
        .eq('status', 'success');
      
      competitors = scrapedData || [];
    }

    console.log(`Analyzing with ${competitors.length} competitor pages...`);

    // Extract topics from AI answer
    const aiTopics = aiAnswer.key_concepts || [];

    // Extract all topics from competitors
    const competitorTopics = extractAllTopics(competitors);

    console.log('AI Topics:', aiTopics);
    console.log('Competitor Topics:', competitorTopics);

    // Find gaps
    const topicsPresent = aiTopics.filter((t: string) => 
      competitorTopics.some(ct => normalizeText(ct).includes(normalizeText(t)))
    );

    const topicsMissing = competitorTopics.filter(t => 
      !aiTopics.some((at: string) => normalizeText(at).includes(normalizeText(t)))
    );

    // Topics weakly represented: in AI answer but only briefly (vs competitor depth)
    const topicsWeak = computeTopicsWeak(aiAnswer, topicsPresent);

    // Analyze structural patterns
    const patterns = analyzeStructuralPatterns(aiAnswer, competitors);

    // Calculate depth score
    const depthScore = calculateDepthScore(aiAnswer, competitors);

    console.log('Analysis results:', {
      topicsPresent: topicsPresent.length,
      topicsMissing: topicsMissing.length,
      topicsWeak: topicsWeak.length,
      depthScore,
    });

    // Save analysis
    const { data: analysis, error: insertError } = await db
      .from('analysis_results')
      .insert({
        ai_answer_id,
        project_id: projectId,
        topics_present: topicsPresent,
        topics_missing: topicsMissing,
        topics_weak: topicsWeak,
        structural_patterns: patterns,
        content_depth_score: depthScore,
        competitor_coverage: {
          total_competitors: competitors.length,
          avg_word_count: competitors.length > 0 
            ? competitors.reduce((sum, c) => sum + (c.word_count || 0), 0) / competitors.length 
            : 0,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Analysis insert error:', insertError);
      throw insertError;
    }

    console.log('Analysis saved:', analysis.id);

    // Generate recommendations based on analysis
    await generateRecommendations(analysis.id, projectId, analysis);

    return NextResponse.json({
      success: true,
      analysis,
    });
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

function extractAllTopics(scrapedContent: any[]): string[] {
  const allTopics = new Set<string>();

  scrapedContent.forEach(content => {
    const h2s = Array.isArray(content.h2_headings) ? content.h2_headings : [];
    const h3s = Array.isArray(content.h3_headings) ? content.h3_headings : [];
    
    [...h2s, ...h3s].forEach(heading => {
      const normalized = normalizeHeading(heading);
      if (normalized.length > 3) {
        allTopics.add(normalized);
      }
    });
  });

  return Array.from(allTopics);
}

function normalizeHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Topics that appear in the AI answer but are only briefly or shallowly covered
 * compared to competitor content (e.g. single mention vs dedicated sections).
 */
function computeTopicsWeak(aiAnswer: any, topicsPresent: string[]): string[] {
  const raw = (aiAnswer.raw_answer || '').toLowerCase();
  const weak: string[] = [];

  for (const topic of topicsPresent) {
    const normalizedTopic = normalizeText(topic);
    if (normalizedTopic.length < 4) continue;

    // Count how many times the topic (or key words) appears in the AI answer
    const words = normalizedTopic.split(/\s+/).filter(Boolean);
    const mentionCount = words.filter(w => raw.includes(w)).length;
    const ratio = words.length > 0 ? mentionCount / words.length : 0;

    // Check for a substantial block of text about this topic (e.g. sentence containing topic + 50+ chars)
    const topicIndex = raw.indexOf(normalizedTopic);
    const snippet = topicIndex >= 0 ? raw.slice(Math.max(0, topicIndex - 20), topicIndex + normalizedTopic.length + 80) : '';
    const snippetWordCount = snippet.split(/\s+/).filter(Boolean).length;

    // Weak = topic present but only brief mention (low ratio or very short context)
    if (ratio < 0.5 || snippetWordCount < 15) {
      weak.push(topic);
    }
  }

  return weak;
}

function analyzeStructuralPatterns(aiAnswer: any, competitors: any[]) {
  const avgSectionLength = competitors.length > 0
    ? competitors.reduce((sum, c) => {
        const h2Count = Array.isArray(c.h2_headings) ? c.h2_headings.length : 0;
        const sections = h2Count || 1;
        return sum + ((c.word_count || 0) / sections);
      }, 0) / competitors.length
    : 0;

  return {
    preferred_format: aiAnswer.answer_format,
    uses_definitions: aiAnswer.raw_answer.includes(':'),
    uses_examples: aiAnswer.raw_answer.toLowerCase().includes('example') || 
                   aiAnswer.raw_answer.toLowerCase().includes('for instance'),
    average_section_length: Math.round(avgSectionLength),
    competitor_avg_h2s: competitors.length > 0
      ? Math.round(competitors.reduce((sum, c) => {
          const h2Count = Array.isArray(c.h2_headings) ? c.h2_headings.length : 0;
          return sum + h2Count;
        }, 0) / competitors.length)
      : 0,
  };
}

function calculateDepthScore(aiAnswer: any, competitors: any[]): number {
  if (competitors.length === 0) return 50;

  const aiWordCount = aiAnswer.raw_answer.split(/\s+/).length;
  const avgCompetitorWords = competitors.reduce((sum, c) => sum + (c.word_count || 0), 0) / competitors.length;
  
  const aiTopics = Array.isArray(aiAnswer.key_concepts) ? aiAnswer.key_concepts.length : 0;
  const avgCompetitorTopics = competitors.reduce((sum, c) => {
    const h2Count = Array.isArray(c.h2_headings) ? c.h2_headings.length : 0;
    const h3Count = Array.isArray(c.h3_headings) ? c.h3_headings.length : 0;
    return sum + h2Count + h3Count;
  }, 0) / competitors.length;

  const wordScore = Math.min((aiWordCount / (avgCompetitorWords || 1)) * 50, 50);
  const topicScore = Math.min((aiTopics / (avgCompetitorTopics || 1)) * 50, 50);

  return Math.round(wordScore + topicScore);
}

async function generateRecommendations(
  analysisId: string,
  projectId: string,
  analysis: any
) {
  const recommendations = [];

  // Generate recommendations for missing topics (limit to top 5)
  const missingTopics = Array.isArray(analysis.topics_missing) 
    ? analysis.topics_missing.slice(0, 5) 
    : [];

  const framing = 'What to add or modify on your website(s) so generative AI engines can better understand, extract, and reuse this content in AI-generated answers:';

  for (const topic of missingTopics) {
    recommendations.push({
      analysis_id: analysisId,
      project_id: projectId,
      priority: 'high',
      category: 'missing_content',
      title: `Add section on "${topic}"`,
      description: `${framing} AI-generated answers frequently include "${topic}", but your content doesn't cover this topic. Add a dedicated section with clear headings and 200-300 words to improve visibility in AI-generated responses.`,
      action_items: [
        { step: 1, action: `Add an H2 heading: "${topic}"`, format: 'heading' },
        { step: 2, action: `Write 200-300 words explaining ${topic}`, format: analysis.structural_patterns?.preferred_format || 'paragraph' },
        { step: 3, action: 'Include specific examples or use cases', format: 'content' },
      ],
      expected_impact: `Increases likelihood of inclusion in AI answers about ${topic} by approximately 40-60%`,
    });
  }

  // Weakly represented topics: expand coverage on your site
  const weakTopics = Array.isArray(analysis.topics_weak) ? analysis.topics_weak.slice(0, 3) : [];
  for (const topic of weakTopics) {
    recommendations.push({
      analysis_id: analysisId,
      project_id: projectId,
      priority: 'medium',
      category: 'missing_content',
      title: `Expand coverage of "${topic}"`,
      description: `${framing} Your content mentions "${topic}" but only briefly. Competitors cover it in more depth. Add a clear H2/H3 section and 150-250 words so AI can reliably extract and cite your content.`,
      action_items: [
        { step: 1, action: `Add or expand an H2/H3 section for "${topic}"`, format: 'heading' },
        { step: 2, action: 'Add 150-250 words with key points and one concrete example', format: 'content' },
      ],
      expected_impact: 'Improves depth of coverage so AI is more likely to quote or summarize your content',
    });
  }

  // Structural recommendations
  if (analysis.structural_patterns?.preferred_format === 'bullet_list') {
    recommendations.push({
      analysis_id: analysisId,
      project_id: projectId,
      priority: 'medium',
      category: 'structural',
      title: 'Convert key sections to bullet lists',
      description: `${framing} AI prefers bullet-list format for this topic. Convert dense paragraphs to concise bullet points so generative engines can extract and reuse your content more reliably.`,
      action_items: [
        { step: 1, action: 'Identify sections with dense paragraphs (>150 words)', format: 'analysis' },
        { step: 2, action: 'Break down into 3-5 key bullet points per section', format: 'bullet_list' },
      ],
      expected_impact: 'Improves readability and AI extraction accuracy',
    });
  }

  // FAQ format recommendation
  recommendations.push({
    analysis_id: analysisId,
    project_id: projectId,
    priority: 'medium',
    category: 'format',
    title: 'Add an FAQ section',
    description: `${framing} Generative engines often surface question–answer pairs. Add a clear FAQ section with 3–5 questions that match common user intents (e.g. "What is…?", "How do I…?") and concise answers so AI can cite your content.`,
    action_items: [
      { step: 1, action: 'List 3–5 common questions your audience asks', format: 'analysis' },
      { step: 2, action: 'Add an H2 "Frequently Asked Questions" and one short answer per question (2–4 sentences)', format: 'faq' },
    ],
    expected_impact: 'Increases chance your content is used in answer-style AI responses',
  });

  // Glossary / definitions recommendation
  if (analysis.structural_patterns?.uses_definitions) {
    recommendations.push({
      analysis_id: analysisId,
      project_id: projectId,
      priority: 'medium',
      category: 'format',
      title: 'Add a glossary or definition block',
      description: `${framing} AI answers for this topic use definition-style content. Add a short glossary or "Key terms" section with clear definitions (term: 1–2 sentences) so generative engines can reuse your definitions.`,
      action_items: [
        { step: 1, action: 'Identify 5–8 key terms your audience and AI answers use', format: 'analysis' },
        { step: 2, action: 'Add an H2 "Key terms" or "Glossary" with term: definition per line', format: 'definitions' },
      ],
      expected_impact: 'Improves inclusion when AI answers include definitions',
    });
  }

  // Step-by-step format recommendation
  if (analysis.structural_patterns?.preferred_format === 'step_by_step') {
    recommendations.push({
      analysis_id: analysisId,
      project_id: projectId,
      priority: 'medium',
      category: 'format',
      title: 'Add clear step-by-step content',
      description: `${framing} Generative engines prefer step-by-step format for this topic. Add numbered steps (e.g. "Step 1:", "Step 2:") with one clear action per step so AI can extract and present your process.`,
      action_items: [
        { step: 1, action: 'Break your process into 4–8 discrete steps', format: 'analysis' },
        { step: 2, action: 'Add an H2 "How to…" and numbered steps with one short paragraph each', format: 'steps' },
      ],
      expected_impact: 'Improves inclusion in how-to and procedural AI answers',
    });
  }

  // Concise summaries (structural improvement)
  recommendations.push({
    analysis_id: analysisId,
    project_id: projectId,
    priority: 'low',
    category: 'structural',
    title: 'Add concise section summaries',
    description: `${framing} Clear headings and concise summaries help AI understand and extract your content. Add a 1–2 sentence summary at the start of each main section (under each H2) so generative engines can quickly identify and reuse key points.`,
    action_items: [
      { step: 1, action: 'Under each H2, add 1–2 sentences summarizing that section', format: 'content' },
      { step: 2, action: 'Keep summaries under 30 words; put detail in the following paragraphs', format: 'content' },
    ],
    expected_impact: 'Improves clarity and structural extraction by AI',
  });

  // Depth recommendation
  if (analysis.content_depth_score < 60) {
    const avgH2s = analysis.structural_patterns?.competitor_avg_h2s || 5;
    recommendations.push({
      analysis_id: analysisId,
      project_id: projectId,
      priority: 'high',
      category: 'structural',
      title: 'Increase content depth and coverage',
      description: `${framing} Your content depth score is ${analysis.content_depth_score}/100. Competitors have more comprehensive coverage with an average of ${avgH2s} main sections. Add more H2 sections and expand each to at least 200 words so AI can extract and reuse your content.`,
      action_items: [
        { step: 1, action: `Add ${Math.max(2, avgH2s - 3)} more main sections (H2 headings)`, format: 'heading' },
        { step: 2, action: 'Expand each section to at least 200 words', format: 'content' },
      ],
      expected_impact: 'Brings content depth in line with top-performing competitors',
    });
  }

  // Insert all recommendations
  if (recommendations.length > 0) {
    const { error } = await db
      .from('recommendations')
      .insert(recommendations);

    if (error) {
      console.error('Error inserting recommendations:', error);
      throw error;
    }
    
    console.log(`Generated ${recommendations.length} recommendations`);
  }
}