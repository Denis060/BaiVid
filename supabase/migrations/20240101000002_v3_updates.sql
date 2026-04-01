-- ============================================================
-- V3 Schema Updates
-- Additive migration: enum patches, new columns, new table
-- ============================================================

-- ========================
-- Section A — Enum patches
-- ========================

-- plan_type: rename business → agency
ALTER TYPE public.plan_type RENAME VALUE 'business' TO 'agency';

-- platform_type: add missing platforms
ALTER TYPE public.platform_type ADD VALUE IF NOT EXISTS 'facebook';
ALTER TYPE public.platform_type ADD VALUE IF NOT EXISTS 'pinterest';
ALTER TYPE public.platform_type ADD VALUE IF NOT EXISTS 'reddit';
ALTER TYPE public.platform_type ADD VALUE IF NOT EXISTS 'threads';

-- video_type: add missing types
ALTER TYPE public.video_type ADD VALUE IF NOT EXISTS 'audio';
ALTER TYPE public.video_type ADD VALUE IF NOT EXISTS 'url';
ALTER TYPE public.video_type ADD VALUE IF NOT EXISTS 'scenes';

-- email_type: add 16 new values
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'idea_generated';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'video_posted';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'video_failed';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'approval_reminder';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'credits_critical';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'credits_exhausted';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'credits_topped_up';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'credits_monthly_refresh';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'autopilot_activated';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'autopilot_paused';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'autopilot_resumed';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'account_reconnect';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'plan_upgraded';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'plan_downgraded';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'payment_failed';
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'milestone_reached';

-- ========================
-- Section B — videos table — add missing columns
-- ========================
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS art_style TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS model_used TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS aspect_ratio TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_autopilot BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS autopilot_run_id UUID REFERENCES public.autopilot_runs(id) ON DELETE SET NULL;

-- ========================
-- Section C — autopilot_profiles table — add missing columns
-- ========================
ALTER TABLE public.autopilot_profiles ADD COLUMN IF NOT EXISTS keywords TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.autopilot_profiles ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE public.autopilot_profiles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.autopilot_profiles ADD COLUMN IF NOT EXISTS approval_mode TEXT NOT NULL DEFAULT 'approve';
ALTER TABLE public.autopilot_profiles ADD COLUMN IF NOT EXISTS auto_topup_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.autopilot_profiles ADD COLUMN IF NOT EXISTS auto_topup_threshold INTEGER NOT NULL DEFAULT 50;
ALTER TABLE public.autopilot_profiles ADD COLUMN IF NOT EXISTS post_times JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.autopilot_profiles ADD COLUMN IF NOT EXISTS video_format TEXT NOT NULL DEFAULT 'short';
ALTER TABLE public.autopilot_profiles ADD COLUMN IF NOT EXISTS art_style TEXT NOT NULL DEFAULT 'cinematic';
ALTER TABLE public.autopilot_profiles ADD COLUMN IF NOT EXISTS duration_pref TEXT NOT NULL DEFAULT '60s';

-- ========================
-- Section D — autopilot_runs table — add missing columns
-- ========================
ALTER TABLE public.autopilot_runs ADD COLUMN IF NOT EXISTS run_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.autopilot_runs ADD COLUMN IF NOT EXISTS platforms_posted TEXT[] NOT NULL DEFAULT '{}';

-- ========================
-- Section E — autopilot_approvals table — add missing columns
-- ========================
ALTER TABLE public.autopilot_approvals ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;
ALTER TABLE public.autopilot_approvals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- ========================
-- Section F — Create autopilot_settings table
-- ========================
CREATE TABLE IF NOT EXISTS public.autopilot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  frequency TEXT NOT NULL DEFAULT 'daily',
  post_times JSONB NOT NULL DEFAULT '{}',
  video_type TEXT NOT NULL DEFAULT 'faceless',
  art_style TEXT NOT NULL DEFAULT 'cinematic',
  voice_id TEXT,
  duration_pref TEXT NOT NULL DEFAULT '60s',
  approval_mode TEXT NOT NULL DEFAULT 'approve',
  auto_topup_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_topup_threshold INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.autopilot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own autopilot settings"
  ON public.autopilot_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own autopilot settings"
  ON public.autopilot_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own autopilot settings"
  ON public.autopilot_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.autopilot_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================
-- Section G — Fix voice_profiles default provider
-- ========================
ALTER TABLE public.voice_profiles ALTER COLUMN provider SET DEFAULT 'fish_audio';
