// app/api/projects/[id]/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const projectId = params.id;

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

    // Get all URLs for this project
    const { data: urls } = await db
      .from('urls')
      .select('*')
      .eq('project_id', projectId);

    if (!urls || urls.length === 0) {
      return NextResponse.json(
        { error: 'No URLs found for this project' },
        { status: 400 }
      );
    }

    console.log(`Starting scraping for ${urls.length} URLs...`);

    // Scrape each URL
    const results = [];
    for (const url of urls) {
      try {
        console.log(`Scraping: ${url.url}`);
        
        // Call Firecrawl API
        const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url.url,
            formats: ['markdown'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Firecrawl API error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.data || !data.data.markdown) {
          throw new Error('No markdown content returned from Firecrawl');
        }
        
        // Extract structure from markdown
        const structure = extractStructure(data.data.markdown);

        console.log(`Extracted structure for ${url.url}:`, {
          h1s: structure.h1s.length,
          h2s: structure.h2s.length,
          h3s: structure.h3s.length,
          wordCount: structure.wordCount,
        });

        // Save to database
        const { data: scrapedContent, error: insertError } = await db
          .from('scraped_content')
          .insert({
            url_id: url.id,
            h1_headings: structure.h1s,
            h2_headings: structure.h2s,
            h3_headings: structure.h3s,
            word_count: structure.wordCount,
            content_structure: structure.fullStructure,
            raw_content: data.data.markdown.substring(0, 50000), // Limit size
            status: 'success',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        results.push({
          url: url.url,
          status: 'success',
          data: {
            id: scrapedContent.id,
            h1_count: structure.h1s.length,
            h2_count: structure.h2s.length,
            h3_count: structure.h3s.length,
            word_count: structure.wordCount,
          },
        });
      } catch (error) {
        console.error(`Error scraping ${url.url}:`, error);
        
        // Save failed status
        await db.from('scraped_content').insert({
          url_id: url.id,
          status: 'failed',
          h1_headings: [],
          h2_headings: [],
          h3_headings: [],
          word_count: 0,
          content_structure: {},
        });

        results.push({
          url: url.url,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`Scraping complete: ${successCount} succeeded, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: urls.length,
        succeeded: successCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error('Error in scraping route:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to scrape content' },
      { status: 500 }
    );
  }
}

// Helper function to extract structure from markdown
function extractStructure(markdown: string) {
  const h1Regex = /^# (.+)$/gm;
  const h2Regex = /^## (.+)$/gm;
  const h3Regex = /^### (.+)$/gm;

  const h1s: string[] = [];
  const h2s: string[] = [];
  const h3s: string[] = [];

  let match;
  while ((match = h1Regex.exec(markdown)) !== null) {
    h1s.push(match[1].trim());
  }
  while ((match = h2Regex.exec(markdown)) !== null) {
    h2s.push(match[1].trim());
  }
  while ((match = h3Regex.exec(markdown)) !== null) {
    h3s.push(match[1].trim());
  }

  const wordCount = markdown.split(/\s+/).filter(word => word.length > 0).length;

  // Build hierarchical structure
  const fullStructure = buildHierarchy(markdown, h1s, h2s, h3s);

  return {
    h1s,
    h2s,
    h3s,
    wordCount,
    fullStructure,
  };
}

function buildHierarchy(markdown: string, h1s: string[], h2s: string[], h3s: string[]) {
  const sections: any[] = [];
  
  // Split by H2 headings
  const h2Pattern = /^## .+$/gm;
  const splits = markdown.split(h2Pattern);
  
  h2s.forEach((h2Title, index) => {
    const sectionContent = splits[index + 1] || '';
    
    // Extract H3s within this section
    const h3Pattern = /^### (.+)$/gm;
    const h3sInSection: string[] = [];
    let h3Match;
    
    while ((h3Match = h3Pattern.exec(sectionContent)) !== null) {
      h3sInSection.push(h3Match[1].trim());
    }
    
    // Count words in this section
    const sectionWordCount = sectionContent.split(/\s+/).filter(w => w.length > 0).length;
    
    sections.push({
      h2: h2Title,
      h3s: h3sInSection,
      wordCount: sectionWordCount,
    });
  });
  
  return { sections };
}