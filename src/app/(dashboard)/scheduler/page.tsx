"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Clock,
  Send,
  X,
  Video,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  schedulePost,
  cancelScheduledPost,
  getScheduledPosts,
  getConnectedAccounts,
  getReadyVideos,
} from "@/actions/scheduler";
import { PLATFORM_CONFIG, type PlatformKey } from "@/lib/publishers/types";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "bg-red-500",
  tiktok: "bg-gray-900 dark:bg-white dark:text-black",
  instagram: "bg-pink-500",
  facebook: "bg-blue-600",
  linkedin: "bg-blue-700",
  pinterest: "bg-red-600",
  twitter: "bg-black dark:bg-white dark:text-black",
  reddit: "bg-orange-500",
  threads: "bg-gray-800",
};

export default function SchedulerPage() {
  const [videos, setVideos] = useState<{ id: string; title: string; type: string; duration: number | null }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; platform: string; platform_username: string | null }[]>([]);
  const [posts, setPosts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      const [v, a, p] = await Promise.all([
        getReadyVideos(),
        getConnectedAccounts(),
        getScheduledPosts(),
      ]);
      setVideos(v);
      setAccounts(a);
      setPosts(p);
      setLoading(false);
    }
    load();
  }, []);

  // Filter accounts by selected platform
  const platformAccounts = accounts.filter((a) => a.platform === selectedPlatform);

  // Auto-select account when platform changes
  useEffect(() => {
    if (platformAccounts.length === 1) {
      setSelectedAccount(platformAccounts[0].id);
    } else {
      setSelectedAccount("");
    }
  }, [selectedPlatform]);

  async function handleSchedule() {
    if (!selectedVideo || !selectedPlatform || !selectedAccount || !scheduledDate || !scheduledTime) {
      setError("Please fill in all fields");
      return;
    }

    setScheduling(true);
    setError("");
    setSuccess("");

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    const result = await schedulePost({
      videoId: selectedVideo,
      platform: selectedPlatform as PlatformKey,
      connectedAccountId: selectedAccount,
      scheduledAt,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Post scheduled successfully!");
      // Refresh posts
      const p = await getScheduledPosts();
      setPosts(p);
      // Reset form
      setSelectedVideo("");
      setSelectedPlatform("");
      setSelectedAccount("");
      setScheduledDate("");
      setScheduledTime("");
    }
    setScheduling(false);
  }

  async function handleCancel(postId: string) {
    await cancelScheduledPost(postId);
    setPosts((prev) =>
      prev.map((p) =>
        (p as { id: string }).id === postId ? { ...p, status: "cancelled" } : p
      )
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Scheduler</h1>
        <p className="text-muted-foreground mt-1">
          Schedule your videos for publishing across platforms.
        </p>
      </div>

      {/* Schedule Form */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule a Post</CardTitle>
          <CardDescription>
            Choose a video, platform, and time to publish.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video */}
          <div className="space-y-2">
            <Label>Video</Label>
            <Select value={selectedVideo} onValueChange={(v) => v && setSelectedVideo(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a ready video" />
              </SelectTrigger>
              <SelectContent>
                {videos.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No ready videos
                  </SelectItem>
                ) : (
                  videos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="flex items-center gap-2">
                        <Video className="h-3 w-3" />
                        {v.title}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label>Platform</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full">
                  No connected platforms.{" "}
                  <a href="/settings" className="text-primary hover:underline">
                    Connect one
                  </a>
                </p>
              ) : (
                [...new Set(accounts.map((a) => a.platform))].map((platform) => {
                  const config = PLATFORM_CONFIG[platform as PlatformKey];
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => setSelectedPlatform(platform)}
                      className={`relative flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-all ${
                        selectedPlatform === platform
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${PLATFORM_COLORS[platform] || "bg-muted"}`} />
                      {config?.name || platform}
                      {config?.comingSoon && (
                        <Badge className="text-[8px] px-1 py-0 bg-yellow-500/20 text-yellow-500">
                          Beta
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary">
              {success}
            </div>
          )}

          <Button
            onClick={handleSchedule}
            disabled={scheduling || !selectedVideo || !selectedPlatform || !selectedAccount || !scheduledDate || !scheduledTime}
            size="lg"
          >
            {scheduling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Schedule Post
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Scheduled Posts</h2>
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No scheduled posts yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const p = post as {
                id: string;
                platform: string;
                scheduled_at: string;
                published_at: string | null;
                status: string;
                error_message: string | null;
                videos: { title: string } | null;
                connected_accounts: { platform_username: string | null } | null;
              };
              const config = PLATFORM_CONFIG[p.platform as PlatformKey];

              return (
                <Card key={p.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={`h-3 w-3 rounded-full shrink-0 ${PLATFORM_COLORS[p.platform] || "bg-muted"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.videos?.title || "Untitled"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {config?.name || p.platform}
                        </span>
                        {p.connected_accounts?.platform_username && (
                          <span className="text-xs text-muted-foreground">
                            @{p.connected_accounts.platform_username}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.scheduled_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={`text-xs ${
                          p.status === "published"
                            ? "bg-green-500/10 text-green-500"
                            : p.status === "failed"
                              ? "bg-red-500/10 text-red-500"
                              : p.status === "cancelled"
                                ? "bg-muted text-muted-foreground"
                                : p.status === "publishing"
                                  ? "bg-yellow-500/10 text-yellow-500"
                                  : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {p.status === "published" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {p.status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                        {p.status === "scheduled" && <Clock className="mr-1 h-3 w-3" />}
                        {p.status === "publishing" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {p.status}
                      </Badge>
                      {p.status === "scheduled" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleCancel(p.id)}
                          title="Cancel"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
