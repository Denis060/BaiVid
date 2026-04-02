-- Google Cloud TTS provider entries
-- Free tier: 1,000,000 characters/month (Standard voices unlimited)
-- Neural2: $0.000016/char after free tier

-- Insert Google TTS providers (using correct column names from providers table)
INSERT INTO providers (name, task_type, tier, cost_per_unit, unit_type, quality_rating, daily_free_credits, is_active, priority_order, api_key_env_var)
VALUES
  ('google-tts-standard', 'tts', 'free', 0.000004, 'character', 4, 33333, true, 1, 'GOOGLE_TTS_API_KEY'),
  ('google-tts-neural2', 'tts', 'free', 0.000016, 'character', 5, 33333, true, 2, 'GOOGLE_TTS_API_KEY')
ON CONFLICT (name) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  priority_order = EXCLUDED.priority_order,
  cost_per_unit = EXCLUDED.cost_per_unit;

-- Update Fish Audio priority to be secondary (was priority 1, now 3)
UPDATE providers SET priority_order = 3 WHERE name = 'fish-audio-free' AND task_type = 'tts';
UPDATE providers SET priority_order = 4 WHERE name = 'fish-audio-paid' AND task_type = 'tts';

-- Add monthly character usage tracking table for Google TTS
CREATE TABLE IF NOT EXISTS public.google_tts_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  character_count INTEGER NOT NULL DEFAULT 0,
  voice_tier TEXT NOT NULL DEFAULT 'neural2',
  month_year TEXT NOT NULL, -- '2026-04' format
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_google_tts_usage_month
  ON public.google_tts_usage (month_year);

CREATE INDEX IF NOT EXISTS idx_google_tts_usage_user_month
  ON public.google_tts_usage (user_id, month_year);

-- RLS
ALTER TABLE public.google_tts_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Google TTS usage"
  ON public.google_tts_usage FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert Google TTS usage"
  ON public.google_tts_usage FOR INSERT
  WITH CHECK (true);
