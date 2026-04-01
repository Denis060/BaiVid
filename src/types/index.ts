import type { Tables, Enums } from "./supabase";

// ========================
// Row types (direct from DB)
// ========================
export type User = Tables<"users">;
export type Subscription = Tables<"subscriptions">;
export type CreditTransaction = Tables<"credits_transactions">;
export type Video = Tables<"videos">;
export type Script = Tables<"scripts">;
export type Idea = Tables<"ideas">;
export type Avatar = Tables<"avatars">;
export type VoiceProfile = Tables<"voice_profiles">;
export type ScheduledPost = Tables<"scheduled_posts">;
export type ConnectedAccount = Tables<"connected_accounts">;
export type AnalyticsSnapshot = Tables<"analytics_snapshots">;
export type AutopilotProfile = Tables<"autopilot_profiles">;
export type AutopilotRun = Tables<"autopilot_runs">;
export type AutopilotApproval = Tables<"autopilot_approvals">;
export type EmailLog = Tables<"email_logs">;
export type EmailPreferences = Tables<"email_preferences">;

// ========================
// Enum types
// ========================
export type PlanType = Enums<"plan_type">;
export type VideoStatus = Enums<"video_status">;
export type VideoType = Enums<"video_type">;
export type IdeaStatus = Enums<"idea_status">;
export type CreditType = Enums<"credit_type">;
export type PostStatus = Enums<"post_status">;
export type PlatformType = Enums<"platform_type">;
export type AutopilotStatus = Enums<"autopilot_status">;
export type ApprovalStatus = Enums<"approval_status">;
export type EmailType = Enums<"email_type">;
