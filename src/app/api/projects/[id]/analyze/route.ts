
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateText, getEmbeddings } from '@/lib/gemini';

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

        const { data: project, error: projectError } = await db
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();

        if (projectError || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const { data: aiAnswer, error: answerError } = await db
            .from('ai_answers')
            .select('*')
            .eq('id', ai_answer_id)
            .eq('project_id', projectId)
            .single();

        if (answerError || !aiAnswer) {
            return NextResponse.json({ error: 'AI answer not found' }, { status: 404 });
        }

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

        const competitorUrlIds = urls.filter(u => u.type === 'competitor').map(u => u.id);
        const targetUrlIds = urls.filter(u => u.type === 'target').map(u => u.id);

        let competitors: any[] = [];
        if (competitorUrlIds.length > 0) {
            const { data: scrapedData } = await db
                .from('scraped_content')
                .select('*')
                .in('url_id', competitorUrlIds)
                .eq('status', 'success');

            competitors = scrapedData || [];
        }

        let targets: any[] = [];
        if (targetUrlIds.length > 0) {
            const { data: targetData } = await db
                .from('scraped_content')
                .select('*')
                .in('url_id', targetUrlIds)
                .eq('status', 'success');
            targets = targetData || [];
        }

        console.log(`Analyzing with ${targets.length} target pages and ${competitors.length} competitor pages...`);

        const aiTopics = aiAnswer.key_concepts || [];
        const competitorTopics = extractAllTopics(competitors);
        const targetTopics = extractAllTopics(targets);

        const apiKey = process.env.GEMINI_API_KEY;

        let semanticCoverage: number = 0;

        let topicsMissing: string[] = [];
        let topicsPresent: string[] = [];
        let competitiveGaps: string[] = [];

        const isTopicInList = (topic: string, list: string[]) =>
            list.some(t => normalizeText(t).includes(normalizeText(topic)) || normalizeText(topic).includes(normalizeText(t)));

        if (competitorTopics.length > 0) {
            const coveredByComps = aiTopics.filter((t: string) => isTopicInList(t, competitorTopics));
            semanticCoverage = Math.round((coveredByComps.length / (aiTopics.length || 1)) * 100);

            if (apiKey) {
                try {
                    const semanticResult = await computeSemanticTopicMatch(aiTopics, competitorTopics, apiKey);
                    if (semanticResult) {
                        semanticCoverage = semanticResult.semanticCoverage;
                        console.log('Semantic Coverage augmented via Embeddings:', semanticCoverage);
                    }
                } catch (err) {
                    console.error('Semantic Coverage calculation failed:', err);
                }
            }
        }

        if (targetTopics.length === 0) {
            topicsMissing = aiTopics;
        } else {
            topicsMissing = aiTopics.filter(t => !isTopicInList(t, targetTopics));
            topicsPresent = aiTopics.filter(t => isTopicInList(t, targetTopics));
        }

        const commonCompetitorTopics = competitorTopics.filter(t => !isTopicInList(t, targetTopics)).slice(0, 5);
        competitiveGaps = commonCompetitorTopics;

        const topicsWeak = computeTopicsWeak(targets, topicsPresent);
        const patterns = analyzeStructuralPatterns(aiAnswer, competitors);
        const depthScore = calculateDepthScore(targets, competitors);

        console.log('Analysis results:', {
            topicsPresent: topicsPresent.length,
            topicsMissing: topicsMissing.length,
            topicsWeak: topicsWeak.length,
            depthScore,
            semanticCoverage,
        });

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

function computeTopicsWeak(targets: any[], topicsPresent: string[]): string[] {
    if (!targets || targets.length === 0) return [];

    const weak: string[] = [];
    const rawTarget = targets.map(t => (t.content || '') + ' ' + (t.clean_text || '')).join(' ').toLowerCase();

    for (const topic of topicsPresent) {
        const normalizedTopic = normalizeText(topic);
        if (normalizedTopic.length < 4) continue;

        const topicIndex = rawTarget.indexOf(normalizedTopic);

        if (topicIndex < 0) {
            weak.push(topic);
            continue;
        }

        const snippet = rawTarget.slice(Math.max(0, topicIndex - 20), topicIndex + normalizedTopic.length + 80);
        const snippetWordCount = snippet.split(/\s+/).filter(Boolean).length;

        if (snippetWordCount < 20) {
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

function calculateDepthScore(targets: any[], competitors: any[]): number {
    if (targets.length === 0) return 0;
    const targetWordCount = targets.reduce((sum, t) => sum + (t.word_count || 0), 0);
    const targetTopicsCount = targets.reduce((sum, t) => {
        return sum + (t.h2_headings?.length || 0) + (t.h3_headings?.length || 0);
    }, 0);

    if (competitors.length === 0) {
        return Math.min(targetWordCount / 1000 * 50, 50) + Math.min(targetTopicsCount / 5 * 50, 50);
    }

    const avgCompWords = competitors.reduce((sum, c) => sum + (c.word_count || 0), 0) / competitors.length;
    const avgCompTopics = competitors.reduce((sum, c) => {
        return sum + (c.h2_headings?.length || 0) + (c.h3_headings?.length || 0);
    }, 0) / competitors.length;

    const wordScore = Math.min((targetWordCount / (avgCompWords || 1)) * 50, 50);
    const topicScore = Math.min((targetTopicsCount / (avgCompTopics || 1)) * 50, 50);

    return Math.round(wordScore + topicScore);
}

async function generateRecommendations(
    analysisId: string,
    projectId: string,
    analysis: any
) {
    const recommendations = [];

    const missingTopics = Array.isArray(analysis.topics_missing)
        ? analysis.topics_missing.filter(isValidContentTopic).slice(0, 3)
        : [];

    const framing = 'What to add or modify on your website(s) so generative AI engines can better understand, extract, and reuse this content in AI-generated answers:';

    for (const topic of missingTopics) {
        const prompt = `
      You are an expert in Generative Engine Optimization (GEO).
      The user's content is missing the topic "${topic}", which is critical for AI answers.
      Generate a specific recommendation to add this topic.
      Return JSON format: { "description": "...", "action_items": [{ "step": 1, "action": "...", "format": "..." }, ...] }
      Make the description actionable and specific to "${topic}".
      Action items should be concrete steps (e.g. "Add H2 heading...", "Include table comparing...").
      Limit to 2-3 action items.
    `;

        let aiRec = null;
        try {
            const text = await generateText(prompt);
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            aiRec = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('Failed to generate AI recommendation for', topic);
        }

        recommendations.push({
            analysis_id: analysisId,
            project_id: projectId,
            priority: 'high',
            category: 'missing_content',
            title: `Add section on "${topic}"`,
            description: aiRec?.description || `${framing} AI-generated answers frequently include "${topic}", but your content doesn't cover this topic. Add a dedicated section to improve visibility.`,
            action_items: aiRec?.action_items || [
                { step: 1, action: `Add an H2 heading: "${topic}"`, format: 'heading' },
                { step: 2, action: `Write 200-300 words explaining ${topic}`, format: 'paragraph' },
            ],
            expected_impact: `High. Increases likelihood of inclusion in AI answers about ${topic}.`,
        });
    }

    const weakTopics = Array.isArray(analysis.topics_weak)
        ? analysis.topics_weak.filter(isValidContentTopic).slice(0, 3)
        : [];

    for (const topic of weakTopics) {
        const prompt = `
      You are an expert in Generative Engine Optimization (GEO).
      The user's content mentions "${topic}" but only briefly. Competitors cover it in depth.
      Generate a specific recommendation to expand coverage of "${topic}".
      Return JSON format: { "description": "...", "action_items": [{ "step": 1, "action": "...", "format": "..." }, ...] }
      Limit to 2 action items.
    `;

        let aiRec = null;
        try {
            const text = await generateText(prompt);
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            aiRec = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('Failed to generate AI recommendation for weak topic', topic);
        }

        recommendations.push({
            analysis_id: analysisId,
            project_id: projectId,
            priority: 'medium',
            category: 'missing_content',
            title: `Expand coverage of "${topic}"`,
            description: aiRec?.description || `${framing} Your content mentions "${topic}" but only briefly. Expand this section to improve authority.`,
            action_items: aiRec?.action_items || [
                { step: 1, action: `Expand the section for "${topic}" to at least 200 words`, format: 'content' },
                { step: 2, action: 'Include specific details, data points, or examples', format: 'content' },
            ],
            expected_impact: 'Medium. Improves depth of coverage so AI is more likely to quote your content.',
        });
    }

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

    recommendations.push({
        analysis_id: analysisId,
        project_id: projectId,
        priority: 'medium',
        category: 'format',
        title: 'Add an FAQ section',
        description: `${framing} Generative engines often surface question–answer pairs. Add a clear FAQ section with 3–5 questions that match common user intents.`,
        action_items: [
            { step: 1, action: 'List 3–5 common questions your audience asks', format: 'analysis' },
            { step: 2, action: 'Add an H2 "Frequently Asked Questions" and one short answer per question (2–4 sentences)', format: 'faq' },
        ],
        expected_impact: 'Increases chance your content is used in answer-style AI responses',
    });

    if (analysis.structural_patterns?.uses_definitions) {
        recommendations.push({
            analysis_id: analysisId,
            project_id: projectId,
            priority: 'medium',
            category: 'format',
            title: 'Add a glossary or definition block',
            description: `${framing} AI answers for this topic use definition-style content. Add a short glossary or "Key terms" section.`,
            action_items: [
                { step: 1, action: 'Identify 5–8 key terms your audience and AI answers use', format: 'analysis' },
                { step: 2, action: 'Add an H2 "Key terms" or "Glossary" with term: definition per line', format: 'definitions' },
            ],
            expected_impact: 'Improves inclusion when AI answers include definitions',
        });
    }

    if (analysis.structural_patterns?.preferred_format === 'step_by_step') {
        recommendations.push({
            analysis_id: analysisId,
            project_id: projectId,
            priority: 'medium',
            category: 'format',
            title: 'Add clear step-by-step content',
            description: `${framing} Generative engines prefer step-by-step format for this topic. Add numbered steps (e.g. "Step 1:", "Step 2:") with one clear action per step.`,
            action_items: [
                { step: 1, action: 'Break your process into 4–8 discrete steps', format: 'analysis' },
                { step: 2, action: 'Add an H2 "How to…" and numbered steps with one short paragraph each', format: 'steps' },
            ],
            expected_impact: 'Improves inclusion in how-to and procedural AI answers',
        });
    }

    if (analysis.content_depth_score < 60) {
        const avgH2s = analysis.structural_patterns?.competitor_avg_h2s || 5;
        recommendations.push({
            analysis_id: analysisId,
            project_id: projectId,
            priority: 'high',
            category: 'structural',
            title: 'Increase content depth and coverage',
            description: `${framing} Your content depth score is ${analysis.content_depth_score}/100. Competitors have more comprehensive coverage.`,
            action_items: [
                { step: 1, action: `Add ${Math.max(2, avgH2s - 3)} more main sections (H2 headings)`, format: 'heading' },
                { step: 2, action: 'Expand each section to at least 200 words', format: 'content' },
            ],
            expected_impact: 'Brings content depth in line with top-performing competitors',
        });
    }

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