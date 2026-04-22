-- SaaS MVP Template - Database Initialization Script
-- This script creates all necessary tables, functions, and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, avatar_url, is_admin)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'email',
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- =========================================================
-- GEOspy agent workflow tables
-- =========================================================

-- Add agent run metadata table (only if projects table exists)
DO $$
BEGIN
  IF to_regclass('public.projects') IS NOT NULL THEN
    EXECUTE $sql$
      CREATE TABLE IF NOT EXISTS public.agent_runs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        status TEXT NOT NULL DEFAULT 'running', -- running | complete | failed
        steps_completed TEXT[] DEFAULT '{}'::TEXT[],
        errors TEXT[] DEFAULT '{}'::TEXT[],
        summary JSONB DEFAULT '{}'::JSONB,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        duration_ms INTEGER
      );

      ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

      DO $pol$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = 'agent_runs'
            AND policyname = 'Users can view own runs'
        ) THEN
          CREATE POLICY "Users can view own runs"
            ON public.agent_runs
            FOR SELECT
            USING (auth.uid() = user_id);
        END IF;
      END
      $pol$;
    $sql$;
  END IF;
END
$$;

-- Projects table additions for agent workflow
ALTER TABLE IF EXISTS public.projects
  ADD COLUMN IF NOT EXISTS last_agent_run_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.projects
  ADD COLUMN IF NOT EXISTS agent_run_count INTEGER DEFAULT 0;

-- Analysis results additions for scoring
ALTER TABLE IF EXISTS public.analysis_results
  ADD COLUMN IF NOT EXISTS geo_score_breakdown JSONB DEFAULT '{}'::JSONB;

ALTER TABLE IF EXISTS public.analysis_results
  ADD COLUMN IF NOT EXISTS competitor_map JSONB DEFAULT '{}'::JSONB;

-- Recommendations additions for completion tracking
ALTER TABLE IF EXISTS public.recommendations
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.recommendations
  ADD COLUMN IF NOT EXISTS quality_score NUMERIC(3,1);
