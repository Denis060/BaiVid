-- ============================================================
-- Row Level Security Policies for all tables
-- ============================================================

-- ========================
-- USERS
-- ========================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT handled by trigger, no direct user inserts needed
-- DELETE not allowed for users

-- ========================
-- SUBSCRIPTIONS
-- ========================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE managed by server (service role via Stripe webhooks)

-- ========================
-- CREDITS_TRANSACTIONS (INSERT-only for users, no UPDATE/DELETE)
-- ========================
ALTER TABLE public.credits_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions"
  ON public.credits_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit transactions"
  ON public.credits_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies — credits_transactions is append-only

-- ========================
-- VIDEOS
-- ========================
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own videos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = user_id);

-- ========================
-- SCRIPTS
-- ========================
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scripts"
  ON public.scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scripts"
  ON public.scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts"
  ON public.scripts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts"
  ON public.scripts FOR DELETE
  USING (auth.uid() = user_id);

-- ========================
-- IDEAS
-- ========================
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ideas"
  ON public.ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas"
  ON public.ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas"
  ON public.ideas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON public.ideas FOR DELETE
  USING (auth.uid() = user_id);

-- ========================
-- AVATARS
-- ========================
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatars"
  ON public.avatars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatars"
  ON public.avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatars"
  ON public.avatars FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own avatars"
  ON public.avatars FOR DELETE
  USING (auth.uid() = user_id);

-- ========================
-- VOICE_PROFILES
-- ========================
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice profiles"
  ON public.voice_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice profiles"
  ON public.voice_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice profiles"
  ON public.voice_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice profiles"
  ON public.voice_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ========================
-- SCHEDULED_POSTS
-- ========================
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled posts"
  ON public.scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled posts"
  ON public.scheduled_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled posts"
  ON public.scheduled_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled posts"
  ON public.scheduled_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ========================
-- CONNECTED_ACCOUNTS
-- ========================
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connected accounts"
  ON public.connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connected accounts"
  ON public.connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected accounts"
  ON public.connected_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connected accounts"
  ON public.connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ========================
-- ANALYTICS_SNAPSHOTS
-- ========================
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON public.analytics_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON public.analytics_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
  ON public.analytics_snapshots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analytics"
  ON public.analytics_snapshots FOR DELETE
  USING (auth.uid() = user_id);

-- ========================
-- AUTOPILOT_PROFILES
-- ========================
ALTER TABLE public.autopilot_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own autopilot profiles"
  ON public.autopilot_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own autopilot profiles"
  ON public.autopilot_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own autopilot profiles"
  ON public.autopilot_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own autopilot profiles"
  ON public.autopilot_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ========================
-- AUTOPILOT_RUNS
-- ========================
ALTER TABLE public.autopilot_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own autopilot runs"
  ON public.autopilot_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own autopilot runs"
  ON public.autopilot_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own autopilot runs"
  ON public.autopilot_runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own autopilot runs"
  ON public.autopilot_runs FOR DELETE
  USING (auth.uid() = user_id);

-- ========================
-- AUTOPILOT_APPROVALS
-- ========================
ALTER TABLE public.autopilot_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own approvals"
  ON public.autopilot_approvals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own approvals"
  ON public.autopilot_approvals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own approvals"
  ON public.autopilot_approvals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE for approvals — audit trail

-- ========================
-- EMAIL_LOGS
-- ========================
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs"
  ON public.email_logs FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE managed by server (service role)

-- ========================
-- EMAIL_PREFERENCES
-- ========================
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email preferences"
  ON public.email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON public.email_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT handled by trigger, no direct user inserts
-- DELETE not allowed
