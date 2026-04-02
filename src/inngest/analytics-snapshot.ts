import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/encryption";
import { sendMilestoneReachedEmail } from "@/lib/email";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type PlatformMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTimeSeconds: number;
  followers?: number;
};

const MILESTONES = [1000, 10000, 100000, 1000000];

export const analyticsSnapshotCron = inngest.createFunction(
  {
    id: "analytics-snapshot-cron",
    triggers: [{ cron: "0 4 * * *" }], // 4 AM UTC daily
  },
  async ({ step }) => {
    const supabase = getServiceClient();

    // Get all connected accounts
    const accounts = await step.run("fetch-accounts", async () => {
      const { data } = await supabase
        .from("connected_accounts")
        .select("id, user_id, platform, platform_user_id, access_token");
      return data || [];
    });

    let snapshotsCreated = 0;

    for (const account of accounts) {
      await step.run(`fetch-${account.platform}-${account.id}`, async () => {
        try {
          const token = decrypt(account.access_token);
          const metrics = await fetchPlatformMetrics(
            account.platform,
            token,
            account.platform_user_id
          );

          // Get user's published videos on this platform
          const { data: posts } = await supabase
            .from("scheduled_posts")
            .select("video_id")
            .eq("user_id", account.user_id)
            .eq("platform", account.platform)
            .eq("status", "published");

          const videoIds = [...new Set((posts || []).map((p) => p.video_id))];

          if (videoIds.length === 0) return;

          // Distribute metrics evenly across videos (simplified)
          const perVideo = {
            views: Math.round(metrics.views / videoIds.length),
            likes: Math.round(metrics.likes / videoIds.length),
            comments: Math.round(metrics.comments / videoIds.length),
            shares: Math.round(metrics.shares / videoIds.length),
            watchTime: Math.round(metrics.watchTimeSeconds / videoIds.length),
          };

          const today = new Date().toISOString().split("T")[0];

          for (const videoId of videoIds) {
            await supabase.from("analytics_snapshots").upsert(
              {
                user_id: account.user_id,
                video_id: videoId,
                platform: account.platform as "youtube" | "tiktok" | "instagram" | "facebook" | "linkedin" | "pinterest" | "twitter" | "reddit" | "threads",
                views: perVideo.views,
                likes: perVideo.likes,
                comments: perVideo.comments,
                shares: perVideo.shares,
                watch_time_seconds: perVideo.watchTime,
                snapshot_date: today,
              },
              { onConflict: "video_id,platform,snapshot_date" }
            );
            snapshotsCreated++;
          }

          // Milestone detection
          if (metrics.followers !== undefined) {
            await checkMilestone(supabase, account.user_id, account.platform, metrics.followers);
          }
        } catch (err) {
          console.error(`Analytics fetch failed for ${account.platform} (${account.id}):`, err);
          // Individual failure doesn't block others
        }
      });
    }

    return { snapshotsCreated, accountsProcessed: accounts.length };
  }
);

async function fetchPlatformMetrics(
  platform: string,
  accessToken: string,
  platformUserId: string
): Promise<PlatformMetrics> {
  switch (platform) {
    case "youtube":
      return fetchYouTubeMetrics(accessToken, platformUserId);
    case "tiktok":
      return fetchTikTokMetrics(accessToken);
    case "instagram":
      return fetchInstagramMetrics(accessToken, platformUserId);
    case "facebook":
      return fetchFacebookMetrics(accessToken, platformUserId);
    case "linkedin":
      return fetchLinkedInMetrics(accessToken, platformUserId);
    case "pinterest":
      return fetchPinterestMetrics(accessToken);
    case "twitter":
      return fetchTwitterMetrics(accessToken, platformUserId);
    case "reddit":
      return fetchRedditMetrics(accessToken);
    case "threads":
      return fetchThreadsMetrics(accessToken, platformUserId);
    default:
      return { views: 0, likes: 0, comments: 0, shares: 0, watchTimeSeconds: 0 };
  }
}

async function fetchYouTubeMetrics(token: string, channelId: string): Promise<PlatformMetrics> {
  try {
    const [analyticsRes, channelRes] = await Promise.all([
      fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${getYesterdayDate()}&endDate=${getYesterdayDate()}&metrics=views,likes,comments,estimatedMinutesWatched`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    ]);

    const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
    const channel = channelRes.ok ? await channelRes.json() : null;
    const row = analytics?.rows?.[0] || [0, 0, 0, 0];
    const subs = parseInt(channel?.items?.[0]?.statistics?.subscriberCount || "0", 10);

    return {
      views: row[0] || 0,
      likes: row[1] || 0,
      comments: row[2] || 0,
      shares: 0,
      watchTimeSeconds: (row[3] || 0) * 60,
      followers: subs,
    };
  } catch {
    return { views: 0, likes: 0, comments: 0, shares: 0, watchTimeSeconds: 0 };
  }
}

async function fetchTikTokMetrics(token: string): Promise<PlatformMetrics> {
  try {
    const res = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count,video_count",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = res.ok ? await res.json() : null;
    const user = data?.data?.user;
    return {
      views: 0,
      likes: user?.likes_count || 0,
      comments: 0,
      shares: 0,
      watchTimeSeconds: 0,
      followers: user?.follower_count || 0,
    };
  } catch {
    return { views: 0, likes: 0, comments: 0, shares: 0, watchTimeSeconds: 0 };
  }
}

async function fetchInstagramMetrics(token: string, userId: string): Promise<PlatformMetrics> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/${userId}?fields=followers_count,media_count&access_token=${token}`
    );
    const data = res.ok ? await res.json() : null;
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      watchTimeSeconds: 0,
      followers: data?.followers_count || 0,
    };
  } catch {
    return { views: 0, likes: 0, comments: 0, shares: 0, watchTimeSeconds: 0 };
  }
}

async function fetchFacebookMetrics(token: string, pageId: string): Promise<PlatformMetrics> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=fan_count&access_token=${token}`
    );
    const data = res.ok ? await res.json() : null;
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      watchTimeSeconds: 0,
      followers: data?.fan_count || 0,
    };
  } catch {
    return { views: 0, likes: 0, comments: 0, shares: 0, watchTimeSeconds: 0 };
  }
}

async function fetchLinkedInMetrics(token: string, userId: string): Promise<PlatformMetrics> {
  try {
    const res = await fetch(
      `https://api.linkedin.com/v2/networkSizes/${userId}?edgeType=CompanyFollowedByMember`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = res.ok ? await res.json() : null;
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      watchTimeSeconds: 0,
      followers: data?.firstDegreeSize || 0,
    };
  } catch {
    return { views: 0, likes: 0, comments: 0, shares: 0, watchTimeSeconds: 0 };
  }
}

async function fetchPinterestMetrics(token: string): Promise<PlatformMetrics> {
  try {
    const res = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = res.ok ? await res.json() : null;
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      watchTimeSeconds: 0,
      followers: data?.follower_count || 0,
    };
  } catch {
    return { views: 0, likes: 0, comments: 0, shares: 0, watchTimeSeconds: 0 };
  }
}

async function fetchTwitterMetrics(token: string, userId: string): Promise<PlatformMetrics> {
  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = res.ok ? await res.json() : null;
    const pm = data?.data?.public_metrics;
    return {
      views: 0,
      likes: pm?.like_count || 0,
      comments: pm?.reply_count || 0,
      shares: pm?.retweet_count || 0,
      watchTimeSeconds: 0,
      followers: pm?.followers_count || 0,
    };
  } catch {
    return { views: 0, likes: 0, comments: 0, shares: 0, watchTimeSeconds: 0 };
  }
}

async function fetchRedditMetrics(token: string): Promise<PlatformMetrics> {
  try {
    const res = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = res.ok ? await res.json() : null;
    return {
      views: 0,
      likes: data?.link_karma || 0,
      comments: data?.comment_karma || 0,
      shares: 0,
      watchTimeSeconds: 0,
    };
  } catch {
    return { views: 0, likes: 0, comments: 0, shares: 0, watchTimeSeconds: 0 };
  }
}

async function fetchThreadsMetrics(token: string, userId: string): Promise<PlatformMetrics> {
  try {
    const res = await fetch(
      `https://graph.threads.net/v1.0/${userId}?fields=id&access_token=${token}`
    );
    // Threads API has limited analytics
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      watchTimeSeconds: 0,
    };
  } catch {
    return { views: 0, likes: 0, comments: 0, shares: 0, watchTimeSeconds: 0 };
  }
}

async function checkMilestone(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  platform: string,
  followers: number
) {
  for (const milestone of MILESTONES) {
    if (followers >= milestone) {
      // Check if we already sent this milestone
      const milestoneKey = `${platform}_${milestone}`;
      const { data: existing } = await supabase
        .from("email_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "milestone_reached")
        .ilike("subject", `%${milestone.toLocaleString()}%`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { data: user } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (user) {
        const label = milestone >= 1000000
          ? `${(milestone / 1000000).toFixed(0)}M`
          : `${(milestone / 1000).toFixed(0)}K`;

        await sendMilestoneReachedEmail(
          user.email,
          userId,
          `${label} Followers on ${platform}`,
          followers.toLocaleString(),
          `You've reached ${label} followers on ${platform}!`
        );
      }
    }
  }
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}
