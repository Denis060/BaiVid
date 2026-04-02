"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  LinkIcon,
  Coins,
  Film,
  Globe,
  FileText,
  Search,
} from "lucide-react";
import { createUrlVideo, fetchUrlContent } from "@/actions/videos";
import { useCreditsStore } from "@/stores/credits-store";

const ART_STYLES = [
  { id: "cinematic", emoji: "🎥", label: "Cinematic" },
  { id: "minimal", emoji: "◻️", label: "Minimal" },
  { id: "bold", emoji: "🔥", label: "Bold" },
  { id: "documentary", emoji: "📸", label: "Documentary" },
  { id: "animated", emoji: "✨", label: "Animated" },
  { id: "lofi", emoji: "☕", label: "Lo-fi" },
  { id: "afrobeat", emoji: "🥁", label: "Afrobeat" },
];

const ASPECT_RATIOS = [
  { value: "16:9" as const, label: "16:9", desc: "YouTube" },
  { value: "9:16" as const, label: "9:16", desc: "TikTok/Reels" },
  { value: "1:1" as const, label: "1:1", desc: "Square" },
];

const DURATIONS = [
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
  { value: 90, label: "90s" },
  { value: 180, label: "3 min" },
];

const CREDIT_COST = 18;

export default function UrlVideoPage() {
  const { credits } = useCreditsStore();
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState<{
    title: string;
    summary: string;
    content: string;
    siteName: string | null;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [artStyle, setArtStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("9:16");
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleFetch() {
    if (!url.trim()) return;
    setFetching(true);
    setError("");
    setFetched(null);

    const result = await fetchUrlContent(url.trim());
    if ("error" in result) {
      setError(typeof result.error === "string" ? result.error : "Failed to fetch URL");
    } else {
      setFetched(result);
      setTitle(result.title);
    }
    setFetching(false);
  }

  async function handleSubmit() {
    if (!fetched || !title.trim()) return;
    setSubmitting(true);
    setError("");
    const result = await createUrlVideo({
      title: title.trim(),
      url: url.trim(),
      content: fetched.content,
      artStyle,
      aspectRatio,
      duration,
    });
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">URL to Video</h1>
        <p className="text-muted-foreground mt-1">
          Paste an article URL and we&apos;ll turn it into a video.
        </p>
      </div>

      {/* URL Input */}
      <Card>
        <CardHeader>
          <CardTitle>Article URL</CardTitle>
          <CardDescription>Paste a blog post, news article, or any web page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleFetch} disabled={fetching || !url.trim()}>
              {fetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Fetch
            </Button>
          </div>

          {/* Loading skeleton */}
          {fetching && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}

          {/* Fetched preview */}
          {fetched && !fetching && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary shrink-0" />
                {fetched.siteName && (
                  <span className="text-xs text-muted-foreground">{fetched.siteName}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label>Title (editable)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <p className="text-sm text-muted-foreground">{fetched.summary}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                {fetched.content.split(/\s+/).length} words extracted
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings (only show after fetch) */}
      {fetched && (
        <>
          {/* Art Style */}
          <Card>
            <CardHeader><CardTitle>Art Style</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {ART_STYLES.map((s) => (
                  <button key={s.id} type="button" onClick={() => setArtStyle(s.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${artStyle === s.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <span className="text-[10px] font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Duration + Aspect Ratio */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Duration</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {DURATIONS.map((d) => (
                    <button key={d.value} type="button" onClick={() => setDuration(d.value)}
                      className={`rounded-lg border p-3 text-center text-sm font-medium transition-all ${duration === d.value ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Aspect Ratio</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ar) => (
                    <button key={ar.value} type="button" onClick={() => setAspectRatio(ar.value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${aspectRatio === ar.value ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                    >
                      <span className="text-sm font-bold">{ar.label}</span>
                      <span className="text-[10px] text-muted-foreground">{ar.desc}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
          )}

          <Button onClick={handleSubmit} disabled={submitting || credits < CREDIT_COST} size="lg" className="w-full">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
            Generate Video
            <Badge variant="outline" className="ml-2 text-xs font-normal">
              <Coins className="mr-1 h-3 w-3" />{CREDIT_COST} credits
            </Badge>
          </Button>
        </>
      )}
    </div>
  );
}
