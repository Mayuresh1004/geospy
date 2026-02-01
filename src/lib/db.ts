import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client (bypasses RLS)
export const db = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Types remain the same...
export type Project = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_topic: string;
  created_at: string;
  updated_at: string;
};

export type URL = {
  id: string;
  project_id: string;
  url: string;
  type: 'target' | 'competitor';
  domain: string;
  created_at: string;
};
export type ScrapedContent = {
  id: string;
  url_id: string;
  h1_headings: string[];
  h2_headings: string[];
  h3_headings: string[];
  word_count: number;
  content_structure: any;
  raw_content?: string;
  scraped_at: string;
  status: 'success' | 'failed' | 'pending';
};

export type AIAnswer = {
  id: string;
  project_id: string;
  query: string;
  raw_answer: string;
  answer_format: 'paragraph' | 'bullet_list' | 'step_by_step' | 'definition';
  key_concepts: string[];
  entities: string[];
  metadata: any;
  created_at: string;
};

export type AnalysisResult = {
  id: string;
  ai_answer_id: string;
  project_id: string;
  topics_present: any[];
  topics_missing: any[];
  topics_weak: any[];
  structural_patterns: any;
  content_depth_score: number;
  competitor_coverage: any;
  analyzed_at: string;
};

export type Recommendation = {
  id: string;
  analysis_id: string;
  project_id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'missing_content' | 'structural' | 'format';
  title: string;
  description: string;
  action_items: any[];
  expected_impact: string;
  created_at: string;
};