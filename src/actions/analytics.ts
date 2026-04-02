"use server";

import { createClient } from "@/lib/supabase/server";

export type DateRange = "7d" | "30d" | "90d" | "custom";

export interface AnalyticsMetrics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalWatchTime: number;
  videosCreated: number;
}

export interface TimeSeriesPoint {
  date: string;
  views: number;
  likes: number;
  platform?: string;
}

export interface TopVideo {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  thumbnailUrl: string | null;
}

export interface PlatformMetrics {
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime: number;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  timeSeries: TimeSeriesPoint[];
  topVideos: TopVideo[];
  platformBreakdown: PlatformMetrics[];
}

export async function getAnalytics(
  platform: string = "all",
  dateRange: DateRange = "30d",
  customFrom?: string,
  customTo?: string
): Promise<AnalyticsData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      metrics: { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalWatchTime: 0, videosCreated: 0 },
      timeSeries: [],
      topVideos: [],
      platformBreakdown: [],
    };
  }

  // Calculate date range
  const now = new Date();
  let fromDate: string;
  const toDate = customTo || now.toISOString().split("T")[0];

  if (dateRange === "custom" && customFrom) {
    fromDate = customFrom;
  } else {
    const days = dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 30;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    fromDate = from.toISOString().split("T")[0];
  }

  // Fetch snapshots
  let query = supabase
    .from("analytics_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .gte("snapshot_date", fromDate)
    .lte("snapshot_date", toDate)
    .order("snapshot_date", { ascending: true });

  if (platform !== "all") {
    query = query.eq("platform", platform as "youtube" | "tiktok" | "instagram" | "twitter" | "linkedin" | "facebook" | "pinterest" | "reddit" | "threads");
  }

  const { data: snapshots } = await query;
  const rows = snapshots || [];

  // Aggregate metrics
  const metrics: AnalyticsMetrics = {
    totalViews: rows.reduce((s, r) => s + r.views, 0),
    totalLikes: rows.reduce((s, r) => s + r.likes, 0),
    totalComments: rows.reduce((s, r) => s + r.comments, 0),
    totalShares: rows.reduce((s, r) => s + r.shares, 0),
    totalWatchTime: rows.reduce((s, r) => s + r.watch_time_seconds, 0),
    videosCreated: 0,
  };

  // Count videos created in range
  const { count } = await supabase
    .from("videos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", `${fromDate}T00:00:00`)
    .lte("created_at", `${toDate}T23:59:59`);

  metrics.videosCreated = count || 0;

  // Time series — group by date
  const dateMap = new Map<string, { views: number; likes: number }>();
  for (const row of rows) {
    const existing = dateMap.get(row.snapshot_date) || { views: 0, likes: 0 };
    dateMap.set(row.snapshot_date, {
      views: existing.views + row.views,
      likes: existing.likes + row.likes,
    });
  }

  const timeSeries: TimeSeriesPoint[] = Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Top videos by views
  const videoMap = new Map<string, { views: number; likes: number }>();
  for (const row of rows) {
    const existing = videoMap.get(row.video_id) || { views: 0, likes: 0 };
    videoMap.set(row.video_id, {
      views: existing.views + row.views,
      likes: existing.likes + row.likes,
    });
  }

  const topVideoIds = Array.from(videoMap.entries())
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 5);

  let topVideos: TopVideo[] = [];
  if (topVideoIds.length > 0) {
    const { data: videoData } = await supabase
      .from("videos")
      .select("id, title, thumbnail_url")
      .in("id", topVideoIds.map(([id]) => id));

    topVideos = topVideoIds.map(([id, stats]) => {
      const video = videoData?.find((v) => v.id === id);
      return {
        videoId: id,
        title: video?.title || "Untitled",
        views: stats.views,
        likes: stats.likes,
        thumbnailUrl: video?.thumbnail_url || null,
      };
    });
  }

  // Platform breakdown
  const platformMap = new Map<string, PlatformMetrics>();
  for (const row of rows) {
    const existing = platformMap.get(row.platform) || {
      platform: row.platform,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      watchTime: 0,
    };
    platformMap.set(row.platform, {
      platform: row.platform,
      views: existing.views + row.views,
      likes: existing.likes + row.likes,
      comments: existing.comments + row.comments,
      shares: existing.shares + row.shares,
      watchTime: existing.watchTime + row.watch_time_seconds,
    });
  }

  const platformBreakdown = Array.from(platformMap.values()).sort(
    (a, b) => b.views - a.views
  );

  return { metrics, timeSeries, topVideos, platformBreakdown };
}
