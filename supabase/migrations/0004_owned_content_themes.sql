-- Nebula Browser v0.4.5 — Owned content, themes, pricing, visibility
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run

-- ============================================================================
-- OWNED CONTENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_owned_content (
  id           TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id   TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'wallpaper' | 'theme' | 'plugin'
  price_paid   NUMERIC(10,2) DEFAULT 0,
  acquired_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_id, content_type)
);

ALTER TABLE public.user_owned_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own owned content" ON public.user_owned_content;
CREATE POLICY "Users view own owned content" ON public.user_owned_content
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own owned content" ON public.user_owned_content;
CREATE POLICY "Users insert own owned content" ON public.user_owned_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own owned content" ON public.user_owned_content;
CREATE POLICY "Users delete own owned content" ON public.user_owned_content
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- THEMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.themes (
  id           TEXT PRIMARY KEY,
  author_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name  TEXT,
  name         TEXT NOT NULL,
  description  TEXT,
  version      TEXT DEFAULT '1.0.0',
  icon         TEXT DEFAULT '🎨',
  config       JSONB NOT NULL,
  tags         TEXT[] DEFAULT '{}',
  installs     INTEGER DEFAULT 0,
  rating       NUMERIC(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  price        NUMERIC(10,2) DEFAULT 0,
  visibility   TEXT DEFAULT 'public',
  is_builtin   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS themes_public_idx ON public.themes(visibility, created_at DESC);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone views public themes" ON public.themes;
CREATE POLICY "Anyone views public themes" ON public.themes
  FOR SELECT USING (visibility = 'public' OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Users insert themes" ON public.themes;
CREATE POLICY "Users insert themes" ON public.themes
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users update own themes" ON public.themes;
CREATE POLICY "Users update own themes" ON public.themes
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users delete own themes" ON public.themes;
CREATE POLICY "Users delete own themes" ON public.themes
  FOR DELETE USING (auth.uid() = author_id);

-- ============================================================================
-- ADD PRICING + VISIBILITY TO WALLPAPERS
-- ============================================================================
ALTER TABLE public.wallpapers ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.wallpapers ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE public.wallpapers ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'abstract';

-- Update the view policy to respect visibility
DROP POLICY IF EXISTS "Anyone can view public wallpapers" ON public.wallpapers;
CREATE POLICY "Anyone can view public wallpapers" ON public.wallpapers
  FOR SELECT USING (
    visibility = 'public' AND is_approved = true
    OR auth.uid() = author_id
  );

-- ============================================================================
-- ADD PRICING + VISIBILITY TO PLUGINS
-- ============================================================================
ALTER TABLE public.plugins ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.plugins ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';

-- ============================================================================
-- DONE
-- ============================================================================
