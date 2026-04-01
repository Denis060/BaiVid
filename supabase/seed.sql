-- ============================================================
-- Seed data for local development
-- NOTE: In production, users are created via auth trigger.
-- For local dev, insert directly into public.users.
-- ============================================================

-- Test user (use a known UUID for local testing)
INSERT INTO public.users (id, email, full_name, plan, credits_balance, onboarding_completed)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@baivid.com',
  'Test User',
  'pro',
  500,
  true
) ON CONFLICT (id) DO NOTHING;

-- Email preferences for test user
INSERT INTO public.email_preferences (user_id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id) DO NOTHING;

-- Subscription
INSERT INTO public.subscriptions (user_id, stripe_subscription_id, stripe_price_id, plan, status, current_period_start, current_period_end)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'sub_test_123',
  'price_test_pro',
  'pro',
  'active',
  now(),
  now() + interval '30 days'
);

-- Credit transactions
INSERT INTO public.credits_transactions (user_id, amount, type, description, balance_after) VALUES
  ('00000000-0000-0000-0000-000000000001', 50, 'bonus', 'Welcome bonus', 50),
  ('00000000-0000-0000-0000-000000000001', 500, 'purchase', 'Pro plan subscription credits', 550),
  ('00000000-0000-0000-0000-000000000001', -10, 'usage', 'Video generation: My First Video', 540),
  ('00000000-0000-0000-0000-000000000001', -5, 'usage', 'Script generation: Product Demo', 535),
  ('00000000-0000-0000-0000-000000000001', -25, 'usage', 'Avatar video: Company Intro', 510),
  ('00000000-0000-0000-0000-000000000001', -10, 'usage', 'Video generation: Weekly Update', 500);

-- Ideas
INSERT INTO public.ideas (user_id, title, description, category, status) VALUES
  ('00000000-0000-0000-0000-000000000001', '10 AI Tools for Content Creators', 'A listicle video covering the best AI tools for video creators in 2024', 'tech', 'scripted'),
  ('00000000-0000-0000-0000-000000000001', 'How to Start a YouTube Channel', 'Step-by-step guide for beginners', 'education', 'new'),
  ('00000000-0000-0000-0000-000000000001', 'Morning Routine for Productivity', 'A motivational faceless video about morning habits', 'lifestyle', 'produced'),
  ('00000000-0000-0000-0000-000000000001', 'Top 5 Coding Languages in 2024', 'Quick comparison of the most in-demand languages', 'tech', 'new'),
  ('00000000-0000-0000-0000-000000000001', 'Passive Income Ideas', 'Various ways to earn passive income online', 'finance', 'archived');

-- Scripts
INSERT INTO public.scripts (id, user_id, title, content, tone, duration_target, word_count) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '10 AI Tools for Creators',
   'Are you a content creator looking to level up? Here are 10 AI tools that will transform your workflow...',
   'energetic', 60, 150),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Product Demo Script',
   'Introducing our revolutionary new product that simplifies your daily tasks...',
   'professional', 90, 220),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Morning Routine',
   'The most successful people in the world all have one thing in common: a powerful morning routine...',
   'motivational', 45, 110);

-- Videos
INSERT INTO public.videos (user_id, title, description, type, status, script_id, duration, credits_used) VALUES
  ('00000000-0000-0000-0000-000000000001', 'My First Video', 'Testing the platform', 'faceless', 'completed',
   '00000000-0000-0000-0000-000000000010', 62, 10),
  ('00000000-0000-0000-0000-000000000001', 'Company Intro', 'Avatar introduction video', 'avatar', 'completed',
   '00000000-0000-0000-0000-000000000011', 95, 25),
  ('00000000-0000-0000-0000-000000000001', 'Weekly Update', 'Weekly channel update', 'faceless', 'completed',
   '00000000-0000-0000-0000-000000000012', 48, 10),
  ('00000000-0000-0000-0000-000000000001', 'Draft Video', 'Work in progress', 'faceless', 'draft',
   NULL, NULL, 0);

-- Voice profiles
INSERT INTO public.voice_profiles (user_id, name, provider, provider_voice_id, language, is_default) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Professional Male', 'elevenlabs', 'pNInz6obpgDQGcFmaJgB', 'en', true),
  ('00000000-0000-0000-0000-000000000001', 'Friendly Female', 'elevenlabs', '21m00Tcm4TlvDq8ikWAM', 'en', false);

-- Avatars
INSERT INTO public.avatars (user_id, name, did_avatar_id, is_default) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Business Avatar', 'amy-jcwCkr1grs', true),
  ('00000000-0000-0000-0000-000000000001', 'Casual Avatar', 'josh-o2gPQJSUVs', false);

-- Autopilot profile
INSERT INTO public.autopilot_profiles (id, user_id, name, niche, tone, video_type, target_platforms, posting_frequency, is_active, requires_approval, max_credits_per_run)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'Tech Channel Autopilot',
  'technology',
  'energetic',
  'faceless',
  ARRAY['youtube', 'tiktok']::platform_type[],
  'daily',
  true,
  15
);

-- Connected account
INSERT INTO public.connected_accounts (user_id, platform, platform_user_id, platform_username, access_token)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'youtube',
  'UC_test_channel_123',
  'BaividTestChannel',
  'ya29.test_access_token'
);
