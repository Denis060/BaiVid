"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Video,
  TrendingUp,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { getAnalytics, type AnalyticsData, type DateRange } from "@/actions/analytics";

const PLATFORMS = [
  { key: "all", label: "All" },
  { key: "youtube", label: "YouTube", color: "#FF0000" },
  { key: "tiktok", label: "TikTok", color: "#010101" },
  { key: "instagram", label: "Instagram", color: "#E1306C" },
  { key: "facebook", label: "Facebook", color: "#1877F2" },
  { key: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { key: "pinterest", label: "Pinterest", color: "#E60023" },
  { key: "twitter", label: "Twitter/X", color: "#1DA1F2", limited: true },
  { key: "reddit", label: "Reddit", color: "#FF4500", limited: true },
  { key: "threads", label: "Threads", color: "#000000", limited: true },
];

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getAnalytics(platform, dateRange);
      setData(result);
      setLoading(false);
    }
    load();
  }, [platform, dateRange]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedPlatform = PLATFORMS.find((p) => p.key === platform);
  const isLimited = selectedPlatform?.limited;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your video performance across platforms.
        </p>
      </div>

      {/* Platform tabs + Date range */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {PLATFORMS.map((p) => (
            <Button
              key={p.key}
              variant={platform === p.key ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatform(p.key)}
              style={
                platform === p.key && p.color
                  ? { backgroundColor: p.color, borderColor: p.color }
                  : undefined
              }
            >
              {p.label}
              {p.limited && (
                <span className="ml-1 text-[10px] opacity-70">*</span>
              )}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {DATE_RANGES.map((dr) => (
            <Button
              key={dr.key}
              variant={dateRange === dr.key ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(dr.key)}
            >
              {dr.label}
            </Button>
          ))}
        </div>
      </div>

      {isLimited && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          {selectedPlatform?.label} has limited analytics API access. Some metrics may show as N/A.
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Views", value: data.metrics.totalViews, icon: Eye, color: "text-blue-500" },
          { label: "Likes", value: data.metrics.totalLikes, icon: Heart, color: "text-red-500" },
          { label: "Comments", value: data.metrics.totalComments, icon: MessageCircle, color: "text-green-500" },
          { label: "Shares", value: data.metrics.totalShares, icon: Share2, color: "text-purple-500" },
          { label: "Watch Time", value: data.metrics.totalWatchTime, icon: Clock, color: "text-orange-500", isTime: true },
          { label: "Videos", value: data.metrics.videosCreated, icon: Video, color: "text-primary" },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                {isLimited && metric.label !== "Videos" && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="text-[8px] px-1 py-0 bg-yellow-500/20 text-yellow-500">
                        Limited
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">May not be fully available for this platform</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-2xl font-bold">
                {metric.isTime
                  ? formatWatchTime(metric.value)
                  : formatNumber(metric.value)}
              </p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Views Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Views Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.timeSeries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                No data for this period.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#888" }}
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: 8,
                    }}
                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke={selectedPlatform?.color || "#0a7c4e"}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="likes"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Videos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Videos</CardTitle>
            <CardDescription>By total views</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topVideos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                No video data yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data.topVideos.map((v) => ({
                    name: v.title.length > 20 ? v.title.slice(0, 20) + "..." : v.title,
                    views: v.views,
                    likes: v.likes,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11, fill: "#888" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="views" fill="#0a7c4e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      {data.platformBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium">Platform</th>
                    <th className="px-4 py-3 text-right font-medium">Views</th>
                    <th className="px-4 py-3 text-right font-medium">Likes</th>
                    <th className="px-4 py-3 text-right font-medium">Comments</th>
                    <th className="px-4 py-3 text-right font-medium">Shares</th>
                    <th className="px-4 py-3 text-right font-medium">Watch Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.platformBreakdown.map((pm) => {
                    const platformInfo = PLATFORMS.find(
                      (p) => p.key === pm.platform
                    );
                    return (
                      <tr key={pm.platform} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  platformInfo?.color || "#666",
                              }}
                            />
                            <span className="font-medium capitalize">
                              {platformInfo?.label || pm.platform}
                            </span>
                            {platformInfo?.limited && (
                              <Badge className="text-[8px] px-1 py-0 bg-yellow-500/20 text-yellow-500">
                                Limited
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(pm.views)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(pm.likes)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(pm.comments)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(pm.shares)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatWatchTime(pm.watchTime)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Video Cards */}
      {data.topVideos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Top Performing Videos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.topVideos.map((video) => (
              <Card key={video.videoId}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="h-16 w-24 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Video className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(video.views)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatNumber(video.likes)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
