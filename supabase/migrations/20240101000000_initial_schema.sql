-- ============================================================
-- Baivid Database Schema
-- 16 tables, indexes, triggers, enums
-- ============================================================

-- ========================
-- ENUMS
-- ========================
CREATE TYPE public.plan_type AS ENUM ('free', 'starter', 'pro', 'business');
CREATE TYPE public.video_status AS ENUM ('draft', 'scripting', 'generating', 'processing', 'completed', 'failed');
CREATE TYPE public.video_type AS ENUM ('faceless', 'avatar');
CREATE TYPE public.idea_status AS ENUM ('new', 'scripted', 'produced', 'archived');
CREATE TYPE public.credit_type AS ENUM ('purchase', 'usage', 'bonus', 'refund', 'subscription');
CREATE TYPE public.post_status AS ENUM ('scheduled', 'publishing', 'published', 'failed', 'cancelled');
CREATE TYPE public.platform_type AS ENUM ('youtube', 'tiktok', 'instagram', 'twitter', 'linkedin');
CREATE TYPE public.autopilot_status AS ENUM ('running', 'paused', 'completed', 'failed');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.email_type AS ENUM ('welcome', 'video_ready', 'credits_low', 'subscription_change', 'weekly_digest', 'autopilot_approval');

-- ========================
-- 1. USERS
-- ========================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan plan_type NOT NULL DEFAULT 'free',
  credits_balance INTEGER NOT NULL DEFAULT 50,
  stripe_customer_id TEXT UNIQUE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 2. SUBSCRIPTIONS
-- ========================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  plan plan_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 3. CREDITS_TRANSACTIONS
-- ========================
CREATE TABLE public.credits_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type credit_type NOT NULL,
  description TEXT,
  reference_id TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 4. VIDEOS
-- ========================
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type video_type NOT NULL,
  status video_status NOT NULL DEFAULT 'draft',
  script_id UUID,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  credits_used INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 5. SCRIPTS
-- ========================
CREATE TABLE public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  idea_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tone TEXT,
  duration_target INTEGER,
  word_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from videos to scripts after scripts table exists
ALTER TABLE public.videos
  ADD CONSTRAINT videos_script_id_fkey FOREIGN KEY (script_id) REFERENCES public.scripts(id) ON DELETE SET NULL;

-- ========================
-- 6. IDEAS
-- ========================
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status idea_status NOT NULL DEFAULT 'new',
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from scripts to ideas after ideas table exists
ALTER TABLE public.scripts
  ADD CONSTRAINT scripts_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id) ON DELETE SET NULL;

-- ========================
-- 7. AVATARS
-- ========================
CREATE TABLE public.avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  did_avatar_id TEXT,
  thumbnail_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 8. VOICE_PROFILES
-- ========================
CREATE TABLE public.voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'elevenlabs',
  provider_voice_id TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  sample_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 9. SCHEDULED_POSTS
-- ========================
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  connected_account_id UUID,
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  status post_status NOT NULL DEFAULT 'scheduled',
  platform_post_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 10. CONNECTED_ACCOUNTS
-- ========================
CREATE TABLE public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, platform_user_id)
);

-- Add FK from scheduled_posts to connected_accounts
ALTER TABLE public.scheduled_posts
  ADD CONSTRAINT scheduled_posts_connected_account_id_fkey
  FOREIGN KEY (connected_account_id) REFERENCES public.connected_accounts(id) ON DELETE SET NULL;

-- ========================
-- 11. ANALYTICS_SNAPSHOTS
-- ========================
CREATE TABLE public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  watch_time_seconds INTEGER NOT NULL DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(video_id, platform, snapshot_date)
);

-- ========================
-- 12. AUTOPILOT_PROFILES
-- ========================
CREATE TABLE public.autopilot_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'professional',
  video_type video_type NOT NULL DEFAULT 'faceless',
  target_platforms platform_type[] NOT NULL DEFAULT '{}',
  posting_frequency TEXT NOT NULL DEFAULT 'daily',
  voice_profile_id UUID REFERENCES public.voice_profiles(id) ON DELETE SET NULL,
  avatar_id UUID REFERENCES public.avatars(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  max_credits_per_run INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 13. AUTOPILOT_RUNS
-- ========================
CREATE TABLE public.autopilot_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.autopilot_profiles(id) ON DELETE CASCADE,
  status autopilot_status NOT NULL DEFAULT 'running',
  idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  credits_used INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ========================
-- 14. AUTOPILOT_APPROVALS
-- ========================
CREATE TABLE public.autopilot_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.autopilot_runs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  status approval_status NOT NULL DEFAULT 'pending',
  feedback TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 15. EMAIL_LOGS
-- ========================
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type email_type NOT NULL,
  subject TEXT NOT NULL,
  resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- 16. EMAIL_PREFERENCES
-- ========================
CREATE TABLE public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_ready BOOLEAN NOT NULL DEFAULT true,
  credits_low BOOLEAN NOT NULL DEFAULT true,
  subscription_change BOOLEAN NOT NULL DEFAULT true,
  weekly_digest BOOLEAN NOT NULL DEFAULT true,
  autopilot_approval BOOLEAN NOT NULL DEFAULT true,
  marketing BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================
-- INDEXES
-- ========================
CREATE INDEX idx_videos_user_created ON public.videos(user_id, created_at DESC);
CREATE INDEX idx_autopilot_runs_user_started ON public.autopilot_runs(user_id, started_at DESC);
CREATE INDEX idx_scheduled_posts_user_scheduled ON public.scheduled_posts(user_id, scheduled_at);
CREATE INDEX idx_credits_transactions_user_created ON public.credits_transactions(user_id, created_at DESC);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_scripts_user ON public.scripts(user_id);
CREATE INDEX idx_ideas_user ON public.ideas(user_id);
CREATE INDEX idx_analytics_video ON public.analytics_snapshots(video_id, snapshot_date DESC);

-- ========================
-- UPDATED_AT TRIGGER FUNCTION
-- ========================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scripts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.autopilot_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================
-- ON AUTH USER CREATED TRIGGER
-- ========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, credits_balance, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    50,
    'free'
  );

  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
