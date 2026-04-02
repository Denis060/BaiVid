-- ============================================================
-- Provider Routing Tables
-- For multi-provider AI routing engine with cost tracking
-- ============================================================

-- Providers registry
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  task_type TEXT NOT NULL, -- video, tts, image, script, captions, avatar, stock, assembly
  tier TEXT NOT NULL DEFAULT 'free', -- free, cheap, premium
  cost_per_unit DECIMAL(10,6) NOT NULL DEFAULT 0,
  unit_type TEXT NOT NULL DEFAULT 'request', -- second, image, request, character
  daily_free_credits INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority_order INTEGER NOT NULL DEFAULT 100,
  api_key_env_var TEXT,
  quality_rating INTEGER NOT NULL DEFAULT 3, -- 1-5
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Provider free credit tracking (daily reset)
CREATE TABLE IF NOT EXISTS public.provider_free_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  credits_available INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_name, date)
);

-- Provider usage log (cost tracking per API call)
CREATE TABLE IF NOT EXISTS public.provider_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  task_type TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  units_used DECIMAL(10,4) NOT NULL DEFAULT 1,
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_provider_usage_user ON public.provider_usage_log(user_id, created_at DESC);
CREATE INDEX idx_provider_usage_provider ON public.provider_usage_log(provider, created_at DESC);
CREATE INDEX idx_provider_free_credits_date ON public.provider_free_credits(provider_name, date);

-- RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_free_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_usage_log ENABLE ROW LEVEL SECURITY;

-- Providers: readable by all authenticated users (read-only)
CREATE POLICY "Authenticated users can view providers"
  ON public.providers FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Free credits: readable by all authenticated users
CREATE POLICY "Authenticated users can view free credits"
  ON public.provider_free_credits FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Usage log: users can view own usage
CREATE POLICY "Users can view own usage"
  ON public.provider_usage_log FOR SELECT
  USING (auth.uid() = user_id);

-- Seed providers
INSERT INTO public.providers (name, task_type, tier, cost_per_unit, unit_type, daily_free_credits, priority_order, api_key_env_var, quality_rating) VALUES
  -- Video
  ('kling-free', 'video', 'free', 0, 'request', 10, 1, 'KLING_API_KEY', 5),
  ('pika-free', 'video', 'free', 0, 'request', 5, 2, 'PIKA_API_KEY', 4),
  ('haiper-free', 'video', 'free', 0, 'request', 5, 3, 'HAIPER_API_KEY', 4),
  ('wan-siliconflow', 'video', 'cheap', 0.01, 'request', 0, 10, 'SILICONFLOW_API_KEY', 3),
  ('kling-paid', 'video', 'cheap', 0.08, 'second', 0, 11, 'KLING_API_KEY', 5),
  ('haiper-paid', 'video', 'cheap', 0.03, 'request', 0, 12, 'HAIPER_API_KEY', 4),
  ('pika-paid', 'video', 'cheap', 0.04, 'request', 0, 13, 'PIKA_API_KEY', 4),
  ('runway', 'video', 'premium', 0.05, 'second', 0, 20, 'RUNWAY_API_KEY', 5),
  ('pexels', 'video', 'free', 0, 'request', 200, 50, 'PEXELS_API_KEY', 3),
  ('pixabay', 'video', 'free', 0, 'request', 200, 51, 'PIXABAY_API_KEY', 3),
  -- TTS
  ('fish-audio-free', 'tts', 'free', 0, 'request', 50, 1, 'FISH_AUDIO_API_KEY', 4),
  ('fish-audio-paid', 'tts', 'cheap', 0.01, 'request', 0, 10, 'FISH_AUDIO_API_KEY', 4),
  ('openai-tts', 'tts', 'cheap', 0.015, 'character', 0, 11, 'OPENAI_API_KEY', 4),
  -- Avatar
  ('d-id', 'avatar', 'cheap', 0.10, 'request', 0, 10, 'DID_API_KEY', 4),
  -- Images
  ('flux-hf', 'image', 'free', 0, 'request', 20, 1, 'HUGGINGFACE_API_KEY', 5),
  ('flux-replicate', 'image', 'cheap', 0.02, 'request', 0, 10, 'REPLICATE_API_KEY', 5),
  ('ideogram', 'image', 'cheap', 0.05, 'request', 0, 11, 'REPLICATE_API_KEY', 5),
  -- Script/Ideas
  ('gemini-flash', 'script', 'free', 0, 'request', 100, 1, 'GEMINI_API_KEY', 5),
  ('grok', 'script', 'cheap', 0.005, 'request', 0, 10, 'GROK_API_KEY', 5),
  ('gpt-4o', 'script', 'premium', 0.02, 'request', 0, 20, 'OPENAI_API_KEY', 5),
  -- Captions
  ('whisper', 'captions', 'free', 0, 'request', 50, 1, NULL, 4),
  -- Assembly
  ('ffmpeg', 'assembly', 'free', 0, 'request', 0, 1, NULL, 5)
ON CONFLICT (name) DO NOTHING;
