import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { sendWeeklySummaryEmail } from "@/lib/email";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const weeklySummaryFunction = inngest.createFunction(
  {
    id: "email-weekly-summary",
    triggers: [{ cron: "0 9 * * 1" }], // Monday 9 AM UTC
  },
  async ({ step }) => {
    const supabase = getServiceClient();

    // Get all users who want weekly digest
    const users = await step.run("fetch-eligible-users", async () => {
      const { data } = await supabase
        .from("email_preferences")
        .select("user_id")
        .eq("weekly_digest", true);
      return data || [];
    });

    let sentCount = 0;

    for (const { user_id } of users) {
      await step.run(`send-summary-${user_id}`, async () => {
        // Get user email
        const { data: user } = await supabase
          .from("users")
          .select("email")
          .eq("id", user_id)
          .single();
        if (!user) return;

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Aggregate analytics for past 7 days
        const { data: snapshots } = await supabase
          .from("analytics_snapshots")
          .select("platform, views, likes, comments, shares")
          .eq("user_id", user_id)
          .gte("snapshot_date", weekAgo.toISOString().split("T")[0]);

        const totalViews = (snapshots || []).reduce((s, r) => s + r.views, 0);
        const totalLikes = (snapshots || []).reduce((s, r) => s + r.likes, 0);
        const totalComments = (snapshots || []).reduce((s, r) => s + r.comments, 0);

        // Count videos created this week
        const { count: videosCreated } = await supabase
          .from("videos")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user_id)
          .gte("created_at", weekAgo.toISOString());

        // Find top video by views
        const { data: topVideos } = await supabase
          .from("analytics_snapshots")
          .select("video_id, views, videos(title)")
          .eq("user_id", user_id)
          .gte("snapshot_date", weekAgo.toISOString().split("T")[0])
          .order("views", { ascending: false })
          .limit(1);

        const topVideo = topVideos?.[0];

        // Platform breakdown
        const platformMap = new Map<string, { views: number; likes: number }>();
        for (const snap of snapshots || []) {
          const existing = platformMap.get(snap.platform) || { views: 0, likes: 0 };
          platformMap.set(snap.platform, {
            views: existing.views + snap.views,
            likes: existing.likes + snap.likes,
          });
        }

        const platformStats = Array.from(platformMap.entries()).map(([platform, stats]) => ({
          platform: platform.charAt(0).toUpperCase() + platform.slice(1),
          views: stats.views,
          likes: stats.likes,
          newFollowers: 0, // Would need follower tracking to compute
        }));

        // Only send if there's any activity
        if (totalViews === 0 && (videosCreated || 0) === 0) return;

        const weekStart = weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const weekEnd = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        await sendWeeklySummaryEmail(user.email, user_id, {
          totalViews,
          totalLikes,
          totalComments,
          videosCreated: videosCreated || 0,
          topVideoTitle: topVideo
            ? (topVideo as Record<string, unknown>).videos
              ? ((topVideo as Record<string, unknown>).videos as { title: string })?.title
              : undefined
            : undefined,
          topVideoViews: topVideo?.views,
          platformStats,
          weekStart,
          weekEnd,
        });

        sentCount++;
      });
    }

    return { sentCount, totalUsers: users.length };
  }
);
