"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Lightbulb,
  FileText,
  Video,
  Zap,
  Calendar,
  BarChart3,
  Coins,
  TrendingUp,
  Play,
  Eye,
  Heart,
  Film,
  User,
  ArrowRight,
} from "lucide-react";
import { useCreditsStore } from "@/stores/credits-store";
import { createClient } from "@/lib/supabase/client";
import { getAutopilotProfile } from "@/actions/autopilot";
import { PLATFORM_CONFIG, type PlatformKey } from "@/lib/publishers/types";

const PLATFORM_DOT_COLORS: Record<string, string> = {
  youtube: "bg-red-500",
  tiktok: "bg-gray-900 dark:bg-white",
  instagram: "bg-pink-500",
  facebook: "bg-blue-600",
  linkedin: "bg-blue-700",
  pinterest: "bg-red-600",
  twitter: "bg-black dark:bg-white",
  reddit: "bg-orange-500",
  threads: "bg-gray-800",
};

const QUICK_ACTIONS = [
  { label: "Generate Ideas", href: "/ideas", icon: Lightbulb, desc: "AI-powered trending topics", color: "text-yellow-500" },
  { label: "Write Script", href: "/scripts", icon: FileText, desc: "Hook + Body + CTA", color: "text-blue-500" },
  { label: "Create Video", href: "/create", icon: Video, desc: "Faceless or Avatar", color: "text-primary" },
  { label: "Schedule Post", href: "/scheduler", icon: Calendar, desc: "Publish to platforms", color: "text-purple-500" },
];

interface DashboardData {
  recentVideos: {
    id: string;
    title: string;
    type: string;
    status: string;
    duration: number | null;
    thumbnail_url: string | null;
    created_at: string;
    is_autopilot: boolean;
  }[];
  videoCount: number;
  connectedPlatforms: string[];
  totalViews: number;
  totalLikes: number;
  autopilotProfile: Awaited<ReturnType<typeof getAutopilotProfile>>;
}

function getPlanCredits(plan: string): number {
  const credits: Record<string, number> = { free: 50, starter: 500, pro: 1500, agency: 5000 };
  return credits[plan] || 50;
}

export default function DashboardPage() {
  const { credits, plan, isLoading: creditsLoading } = useCreditsStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [videosRes, accountsRes, analyticsRes, autopilotProfile] = await Promise.all([
        supabase
          .from("videos")
          .select("id, title, type, status, duration, thumbnail_url, created_at, is_autopilot", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("connected_accounts")
          .select("platform")
          .eq("user_id", user.id),
        supabase
          .from("analytics_snapshots")
          .select("views, likes")
          .eq("user_id", user.id)
          .gte("snapshot_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
        getAutopilotProfile(),
      ]);

      const totalViews = (analyticsRes.data || []).reduce((s, r) => s + r.views, 0);
      const totalLikes = (analyticsRes.data || []).reduce((s, r) => s + r.likes, 0);

      setData({
        recentVideos: videosRes.data || [],
        videoCount: videosRes.count || 0,
        connectedPlatforms: [...new Set((accountsRes.data || []).map((a) => a.platform))],
        totalViews,
        totalLikes,
        autopilotProfile,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const planCredits = getPlanCredits(plan);
  const creditPercent = Math.min(100, Math.round((credits / planCredits) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your AI video creation command center.
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Credits */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Coins className="h-3 w-3" /> Credits
            </CardDescription>
            <CardTitle className="text-2xl">
              {creditsLoading ? "..." : credits.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={creditPercent} className="h-1.5 mb-1" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {creditPercent}% of {planCredits.toLocaleString()}
              </p>
              <Badge variant="outline" className="text-[10px] capitalize">
                {plan}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Videos */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Video className="h-3 w-3" /> Videos
            </CardDescription>
            <CardTitle className="text-2xl">{data?.videoCount || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total created</p>
          </CardContent>
        </Card>

        {/* Views (30d) */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> Views (30d)
            </CardDescription>
            <CardTitle className="text-2xl">
              {(data?.totalViews || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <Heart className="inline h-3 w-3 mr-1" />
              {(data?.totalLikes || 0).toLocaleString()} likes
            </p>
          </CardContent>
        </Card>

        {/* Autopilot */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Zap className="h-3 w-3" /> Autopilot
            </CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {data?.autopilotProfile ? (
                <>
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      data.autopilotProfile.is_active ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  />
                  {data.autopilotProfile.is_active ? "Active" : "Paused"}
                </>
              ) : (
                "Not Set Up"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.autopilotProfile ? (
              <p className="text-xs text-muted-foreground capitalize">
                {data.autopilotProfile.niche} · {data.autopilotProfile.posting_frequency}
              </p>
            ) : (
              <Link href="/autopilot" className="text-xs text-primary hover:underline">
                Set up Autopilot →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="h-full transition-all hover:ring-1 hover:ring-primary/50 hover:bg-accent/50 cursor-pointer">
                <CardContent className="pt-5 pb-4">
                  <action.icon className={`h-6 w-6 mb-3 ${action.color}`} />
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {action.desc}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Connected Platforms */}
      {data && data.connectedPlatforms.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Connected Platforms</CardTitle>
              <Link
                href="/settings/connections"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.connectedPlatforms.map((p) => (
                <Badge key={p} variant="outline" className="capitalize flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${PLATFORM_DOT_COLORS[p] || "bg-muted"}`} />
                  {PLATFORM_CONFIG[p as PlatformKey]?.name || p}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Videos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Videos</h2>
          <Link
            href="/videos"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {!data || data.recentVideos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No videos yet. Create your first video to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {data.recentVideos.map((video) => {
              const isProcessing = ["draft", "scripting", "generating", "processing"].includes(video.status);
              return (
                <Link key={video.id} href="/videos">
                  <Card className="overflow-hidden hover:ring-1 hover:ring-primary/50 transition-all">
                    <div className="relative aspect-video bg-muted flex items-center justify-center">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground">
                          {isProcessing ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : video.type === "avatar" ? (
                            <User className="h-6 w-6" />
                          ) : (
                            <Film className="h-6 w-6" />
                          )}
                        </div>
                      )}
                      {video.status === "completed" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      )}
                      {video.is_autopilot && (
                        <div className="absolute top-1 right-1">
                          <Zap className="h-3 w-3 text-purple-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate">{video.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {video.type} · {video.status === "completed" ? "Ready" : video.status}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
