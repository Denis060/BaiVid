"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Search,
  Play,
  Download,
  Trash2,
  Pencil,
  Link2,
  MoreVertical,
  Video,
  Zap,
  AlertCircle,
  Clock,
  Check,
  Film,
  User,
  Calendar,
  Coins,
} from "lucide-react";
import {
  getVideos,
  deleteVideo,
  renameVideo,
  getVideoDownloadUrl,
} from "@/actions/videos";
import { createClient } from "@/lib/supabase/client";
import type { Video as VideoType } from "@/types";

type FilterKey = "all" | "processing" | "completed" | "failed" | "autopilot";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "completed", label: "Ready" },
  { key: "failed", label: "Failed" },
  { key: "autopilot", label: "Autopilot" },
];

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

function getStatusConfig(status: string) {
  switch (status) {
    case "completed":
      return { label: "Ready", color: "bg-green-500/10 text-green-500" };
    case "failed":
      return { label: "Failed", color: "bg-red-500/10 text-red-500" };
    case "draft":
    case "scripting":
    case "generating":
    case "processing":
      return { label: "Processing", color: "bg-yellow-500/10 text-yellow-500" };
    default:
      return { label: status, color: "bg-muted text-muted-foreground" };
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `0:${s.toString().padStart(2, "0")}`;
}

interface VideoWithPlatforms extends VideoType {
  platforms?: string[];
}

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoWithPlatforms[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedVideo, setSelectedVideo] = useState<VideoWithPlatforms | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const result = await getVideos(filter, search, page);

    // Fetch platform tags for all videos
    const supabase = createClient();
    const videoIds = result.videos.map((v) => v.id);
    let platformMap: Record<string, string[]> = {};

    if (videoIds.length > 0) {
      const { data: posts } = await supabase
        .from("scheduled_posts")
        .select("video_id, platform")
        .in("video_id", videoIds)
        .in("status", ["scheduled", "published", "publishing"]);

      if (posts) {
        for (const p of posts) {
          if (!platformMap[p.video_id]) platformMap[p.video_id] = [];
          if (!platformMap[p.video_id].includes(p.platform)) {
            platformMap[p.video_id].push(p.platform);
          }
        }
      }
    }

    setVideos(
      result.videos.map((v) => ({
        ...v,
        platforms: platformMap[v.id] || [],
      }))
    );
    setTotalCount(result.count);
    setLoading(false);
  }, [filter, search, page]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("videos-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "videos" },
        (payload) => {
          const updated = payload.new as VideoType;
          setVideos((prev) =>
            prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v))
          );
          setSelectedVideo((prev) =>
            prev?.id === updated.id ? { ...prev, ...updated } : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleDelete(videoId: string) {
    await deleteVideo(videoId);
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    setTotalCount((c) => c - 1);
    if (selectedVideo?.id === videoId) setSelectedVideo(null);
  }

  async function handleRename(videoId: string) {
    if (!renameValue.trim()) return;
    await renameVideo(videoId, renameValue.trim());
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, title: renameValue.trim() } : v))
    );
    setRenaming(null);
  }

  async function handleDownload(videoId: string) {
    const result = await getVideoDownloadUrl(videoId);
    if (result.url) window.open(result.url, "_blank");
  }

  function copyLink(videoUrl: string) {
    navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasMore = page * 20 < totalCount;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-muted-foreground mt-1">
            {totalCount} video{totalCount !== 1 ? "s" : ""} in your library
          </p>
        </div>
      </div>

      {/* Filter bar + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter(f.key); setPage(1); }}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No videos yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first video to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => {
              const statusConfig = getStatusConfig(video.status);
              const isProcessing = ["draft", "scripting", "generating", "processing"].includes(video.status);
              const isReady = video.status === "completed";

              return (
                <Card
                  key={video.id}
                  className={`group overflow-hidden cursor-pointer transition-all hover:ring-1 hover:ring-primary/50 ${isReady ? "" : "opacity-90"}`}
                  onClick={() => isReady && setSelectedVideo(video)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                    {video.thumbnail_url ? (
                      <Image
                        src={video.thumbnail_url}
                        alt={video.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        {isProcessing ? (
                          <Loader2 className="h-8 w-8 animate-spin" />
                        ) : video.type === "avatar" ? (
                          <User className="h-8 w-8" />
                        ) : (
                          <Film className="h-8 w-8" />
                        )}
                      </div>
                    )}

                    {isReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90">
                          <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                    )}

                    {video.duration && (
                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                        {formatDuration(video.duration)}
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <Badge className={`text-xs ${statusConfig.color}`}>
                        {isProcessing && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {video.is_autopilot && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-purple-500/10 text-purple-500 text-xs">
                          <Zap className="mr-1 h-3 w-3" />Auto
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {renaming === video.id ? (
                          <form
                            onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); handleRename(video.id); }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => setRenaming(null)}
                              autoFocus
                              className="h-7 text-sm"
                            />
                          </form>
                        ) : (
                          <p className="text-sm font-medium truncate">{video.title}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {video.type}
                          </Badge>
                          {video.art_style && (
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {video.art_style}
                            </span>
                          )}
                          {video.credits_used > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Coins className="h-2.5 w-2.5" />{video.credits_used}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(video.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {/* Platform tags */}
                        {video.platforms && video.platforms.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {video.platforms.map((p) => (
                              <div
                                key={p}
                                className={`h-2 w-2 rounded-full ${PLATFORM_DOT_COLORS[p] || "bg-muted"}`}
                                title={p}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="p-1 rounded hover:bg-accent shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isReady && (
                            <DropdownMenuItem onClick={() => handleDownload(video.id)}>
                              <Download className="mr-2 h-4 w-4" />Download
                            </DropdownMenuItem>
                          )}
                          {isReady && video.video_url && (
                            <DropdownMenuItem onClick={() => copyLink(video.video_url!)}>
                              <Link2 className="mr-2 h-4 w-4" />{copied ? "Copied!" : "Copy Link"}
                            </DropdownMenuItem>
                          )}
                          {isReady && (
                            <DropdownMenuItem onClick={() => router.push(`/scheduler?videoId=${video.id}`)}>
                              <Calendar className="mr-2 h-4 w-4" />Schedule
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => { setRenaming(video.id); setRenameValue(video.title); }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(video.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)}>
                Previous
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(totalCount / 20)}
            </span>
            {hasMore && (
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)}>
                Next
              </Button>
            )}
          </div>
        </>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            <div className="relative">
              {selectedVideo.video_url ? (
                <video
                  src={selectedVideo.video_url}
                  controls
                  autoPlay
                  className="w-full aspect-video bg-black"
                />
              ) : (
                <div className="w-full aspect-video bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">Video not available</p>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle>{selectedVideo.title}</DialogTitle>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">{selectedVideo.type}</Badge>
                {selectedVideo.art_style && (
                  <Badge variant="outline" className="capitalize">{selectedVideo.art_style}</Badge>
                )}
                {selectedVideo.aspect_ratio && (
                  <Badge variant="outline">{selectedVideo.aspect_ratio}</Badge>
                )}
                {selectedVideo.model_used && (
                  <Badge variant="outline" className="capitalize">{selectedVideo.model_used}</Badge>
                )}
                {selectedVideo.duration && (
                  <span className="text-sm text-muted-foreground">{formatDuration(selectedVideo.duration)}</span>
                )}
                {selectedVideo.credits_used > 0 && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Coins className="h-3 w-3" />{selectedVideo.credits_used} credits
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedVideo.created_at).toLocaleDateString()}
                </span>
                {selectedVideo.is_autopilot && (
                  <Badge className="bg-purple-500/10 text-purple-500">
                    <Zap className="mr-1 h-3 w-3" />Autopilot
                  </Badge>
                )}
                {/* Platform tags in modal */}
                {selectedVideo.platforms && selectedVideo.platforms.length > 0 && (
                  <>
                    {selectedVideo.platforms.map((p) => (
                      <Badge key={p} variant="outline" className="capitalize text-xs">
                        <div className={`h-2 w-2 rounded-full mr-1 ${PLATFORM_DOT_COLORS[p] || "bg-muted"}`} />
                        {p}
                      </Badge>
                    ))}
                  </>
                )}
              </div>

              {selectedVideo.status === "failed" && selectedVideo.error_message && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="inline mr-2 h-4 w-4" />
                  {selectedVideo.error_message}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload(selectedVideo.id)}>
                  <Download className="mr-2 h-4 w-4" />Download
                </Button>
                {selectedVideo.video_url && (
                  <Button variant="outline" size="sm" onClick={() => copyLink(selectedVideo.video_url!)}>
                    <Link2 className="mr-2 h-4 w-4" />{copied ? "Copied!" : "Share Link"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedVideo(null);
                    router.push(`/scheduler?videoId=${selectedVideo.id}`);
                  }}
                >
                  <Calendar className="mr-2 h-4 w-4" />Schedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRenaming(selectedVideo.id);
                    setRenameValue(selectedVideo.title);
                    setSelectedVideo(null);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />Rename
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(selectedVideo.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
