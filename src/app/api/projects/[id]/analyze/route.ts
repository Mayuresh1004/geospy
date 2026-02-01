// app/api/projects/[id]/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

const GEMINI_EMBED_MODEL = 'gemini-embedding-001';
const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBED_MODEL}:embedContent`;
const SEMANTIC_SIMILARITY_THRESHOLD = 0.65;
const MAX_TOPICS_TO_EMBED = 40;

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

    // Extract all topics from competitors (H2/H3 headings)
    const competitorTopics = extractAllTopics(competitors);

    console.log('AI Topics:', aiTopics.length, 'Competitor Topics:', competitorTopics.length);

    // Semantic topic matching (embeddings) with fallback to substring
    const apiKey = process.env.GEMINI_API_KEY;
    let topicsPresent: string[];
    let topicsMissing: string[];
    let semanticCoverage: number | null = null;

    if (apiKey && aiTopics.length > 0 && competitorTopics.length > 0) {
      const semanticResult = await computeSemanticTopicMatch(aiTopics, competitorTopics, apiKey);
      if (semanticResult) {
        topicsPresent = semanticResult.topicsPresent;
        topicsMissing = semanticResult.topicsMissing;
        semanticCoverage = semanticResult.semanticCoverage;
        console.log('Using semantic topic match. Coverage:', semanticCoverage + '%');
      } else {
        topicsPresent = aiTopics.filter((t: string) =>
          competitorTopics.some(ct => normalizeText(ct).includes(normalizeText(t)))
        );
        topicsMissing = competitorTopics.filter(t =>
          !aiTopics.some((at: string) => normalizeText(at).includes(normalizeText(t)))
        );
      }
    } else {
      topicsPresent = aiTopics.filter((t: string) =>
        competitorTopics.some(ct => normalizeText(ct).includes(normalizeText(t)))
      );
      topicsMissing = competitorTopics.filter(t =>
        !aiTopics.some((at: string) => normalizeText(at).includes(normalizeText(t)))
      );
    }

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
      semanticCoverage: semanticCoverage ?? 'n/a',
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
          semantic_coverage: semanticCoverage ?? undefined,
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
      if (normalized.length > 3 && isValidContentTopic(normalized)) {
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

// Normalized (lowercase, no punctuation) nav/UI/widget phrases — not real content topics
const NAV_UI_TOPIC_BLOCKLIST = new Set([
  'login', 'register', 'sign in', 'sign up', 'logout', 'menu', 'navigation', 'post navigation',
  'search', 'home', 'about', 'about us', 'contact', 'contact us', 'follow us', 'subscribe',
  'categories', 'tags', 'archives', 'comments', 'share', 'sidebar', 'footer', 'header',
  'internal links', 'internal links for you', 'related posts', 'related articles', 'you may also like',
  'popular posts', 'recent posts', 'categories for you', 'posts for you', 'related content',
  'cookie policy', 'privacy policy', 'terms of service', 'terms and conditions', 'copyright',
  'breadcrumb', 'breadcrumbs', 'skip to content', 'main content', 'table of contents',
  'social media', 'follow', 'tweet', 'like us', 'newsletter', 'newsletter signup',
  'advertisement', 'ad', 'sponsored', 'recommended for you', 'trending', 'most read',
]);

/**
 * Reject URL-like, slug-like, nav/UI/widget "topics" so they never become recommendations.
 */
function isValidContentTopic(topic: string): boolean {
  const t = topic.trim();
  if (t.length < 4) return false;
  const lower = t.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (lower.includes('http') || lower.includes('www')) return false;
  if (lower.includes('.com') || lower.includes('.co.') || lower.includes('couk') || lower.includes('author/')) return false;
  const noSpaces = t.replace(/\s+/g, '');
  if (noSpaces.length > 40) return false;
  const letterCount = (t.match(/[a-z]/gi) || []).length;
  if (letterCount < 3 || letterCount / (t.length || 1) < 0.5) return false;
  if (NAV_UI_TOPIC_BLOCKLIST.has(lower)) return false;
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length === 1 && NAV_UI_TOPIC_BLOCKLIST.has(words[0])) return false;
  for (const blocked of NAV_UI_TOPIC_BLOCKLIST) {
    if (lower === blocked || lower.startsWith(blocked + ' ') || lower.endsWith(' ' + blocked)) return false;
  }
  return true;
}

// =========================
// Semantic matching (Gemini embeddings)
// =========================

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${GEMINI_EMBED_MODEL}`,
      content: { parts: [{ text: text.slice(0, 8000) }] },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embed failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  const values = data?.embedding?.values;
  if (!Array.isArray(values)) throw new Error('Invalid embed response');
  return values;
}

async function getEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    const vec = await getEmbedding(texts[i], apiKey);
    results.push(vec);
  }
  return results;
}

/**
 * Semantic topic match using embeddings. Returns null if embedding API fails (caller should fallback to substring).
 */
async function computeSemanticTopicMatch(
  aiTopics: string[],
  competitorTopics: string[],
  apiKey: string
): Promise<{
  topicsPresent: string[];
  topicsMissing: string[];
  semanticCoverage: number;
} | null> {
  const aiSlice = aiTopics.slice(0, MAX_TOPICS_TO_EMBED).filter((t) => t.trim().length > 2);
  const compSlice = competitorTopics.slice(0, MAX_TOPICS_TO_EMBED).filter((t) => t.trim().length > 2);
  if (aiSlice.length === 0 || compSlice.length === 0) return null;

  try {
    const [aiEmbeddings, compEmbeddings] = await Promise.all([
      getEmbeddings(aiSlice, apiKey),
      getEmbeddings(compSlice, apiKey),
    ]);

    const topicsPresent: string[] = [];
    for (let i = 0; i < aiSlice.length; i++) {
      let maxSim = 0;
      for (let j = 0; j < compSlice.length; j++) {
        const sim = cosineSimilarity(aiEmbeddings[i], compEmbeddings[j]);
        if (sim > maxSim) maxSim = sim;
      }
      if (maxSim >= SEMANTIC_SIMILARITY_THRESHOLD) {
        topicsPresent.push(aiSlice[i]);
      }
    }

    const topicsMissing: string[] = [];
    for (let j = 0; j < compSlice.length; j++) {
      let maxSim = 0;
      for (let i = 0; i < aiSlice.length; i++) {
        const sim = cosineSimilarity(compEmbeddings[j], aiEmbeddings[i]);
        if (sim > maxSim) maxSim = sim;
      }
      if (maxSim < SEMANTIC_SIMILARITY_THRESHOLD) {
        topicsMissing.push(compSlice[j]);
      }
    }

    const covered = compSlice.length - topicsMissing.length;
    const semanticCoverage = compSlice.length > 0 ? Math.round((covered / compSlice.length) * 100) : 0;

    return { topicsPresent, topicsMissing, semanticCoverage };
  } catch (err) {
    console.warn('Semantic topic match failed, falling back to substring:', err);
    return null;
  }
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

  // Generate recommendations for missing topics (limit to top 5, skip URL/junk)
  const missingTopics = Array.isArray(analysis.topics_missing)
    ? analysis.topics_missing.filter(isValidContentTopic).slice(0, 5)
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

  // Weakly represented topics: expand coverage on your site (skip URL/junk)
  const weakTopics = Array.isArray(analysis.topics_weak)
    ? analysis.topics_weak.filter(isValidContentTopic).slice(0, 3)
    : [];
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