/**
 * Shared types for all platform publishers.
 */

export interface PublishInput {
  videoUrl: string;
  title: string;
  description: string;
  accessToken: string;
  refreshToken?: string;
  platformUserId: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export type PlatformKey =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "pinterest"
  | "twitter"
  | "reddit"
  | "threads";

export const PLATFORM_CONFIG: Record<
  PlatformKey,
  { name: string; maxDuration?: number; warning?: string; comingSoon?: boolean }
> = {
  youtube: { name: "YouTube" },
  tiktok: { name: "TikTok" },
  instagram: { name: "Instagram", warning: "Business/Creator accounts only" },
  facebook: { name: "Facebook", warning: "Pages only (not personal profiles)" },
  linkedin: { name: "LinkedIn" },
  pinterest: { name: "Pinterest" },
  twitter: {
    name: "Twitter/X",
    maxDuration: 140,
    warning: "Requires paid X API tier ($100+/mo); clips ≤ 2min 20s",
  },
  reddit: { name: "Reddit", warning: "Rate-limited; posts to specified subreddit" },
  threads: {
    name: "Threads",
    comingSoon: true,
    warning: "Early access API; video posting not yet stable",
  },
};
