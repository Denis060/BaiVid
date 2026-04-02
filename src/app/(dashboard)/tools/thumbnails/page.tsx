"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  Loader2,
  Image as ImageIcon,
  Download,
  Check,
  Coins,
  Sparkles,
  Upload,
  RefreshCw,
} from "lucide-react";
import {
  generateThumbnails,
  setVideoThumbnail,
  type ThumbnailStyle,
  type GenerateThumbnailsResult,
} from "@/actions/thumbnails";

const STYLES: { value: ThumbnailStyle; label: string; emoji: string; desc: string }[] = [
  { value: "bold", label: "Bold Text Overlay", emoji: "🔥", desc: "Vibrant, high-contrast, attention-grabbing" },
  { value: "cinematic", label: "Cinematic", emoji: "🎬", desc: "Film-quality, dramatic lighting" },
  { value: "minimal", label: "Minimal", emoji: "◻️", desc: "Clean, simple, modern" },
  { value: "documentary", label: "Documentary", emoji: "📸", desc: "Authentic, realistic, journalistic" },
];

function ThumbnailContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId") || "";
  const videoTitle = searchParams.get("title") || "";

  const [title, setTitle] = useState(videoTitle);
  const [style, setStyle] = useState<ThumbnailStyle>("bold");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<NonNullable<GenerateThumbnailsResult["thumbnails"]>>([]);
  const [error, setError] = useState("");
  const [settingThumbnail, setSettingThumbnail] = useState<string | null>(null);
  const [thumbnailSet, setThumbnailSet] = useState<string | null>(null);

  // Text overlay controls
  const [overlayText, setOverlayText] = useState(videoTitle || "");
  const [overlayFontSize, setOverlayFontSize] = useState(48);
  const [overlayColor, setOverlayColor] = useState("#ffffff");
  const [overlayPosition, setOverlayPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [overlayBg, setOverlayBg] = useState(true);

  async function handleGenerate() {
    if (!title.trim()) return;
    setGenerating(true);
    setError("");
    setResults([]);
    setThumbnailSet(null);
    if (!overlayText) setOverlayText(title.trim());

    const result = await generateThumbnails({
      title: title.trim(),
      style,
      videoId: videoId || undefined,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.thumbnails) {
      setResults(result.thumbnails);
    }
    setGenerating(false);
  }

  async function handleSetThumbnail(url: string) {
    if (!videoId) return;
    setSettingThumbnail(url);
    const result = await setVideoThumbnail(videoId, url);
    if (!result.error) {
      setThumbnailSet(url);
    }
    setSettingThumbnail(null);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">AI Thumbnail Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate platform-optimized thumbnails for your videos.
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Thumbnails</CardTitle>
          <CardDescription>
            Enter a title and pick a style. We&apos;ll create 3 optimized variants.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Video Title</Label>
            <Input
              placeholder="e.g. 10 AI Tools That Will Change Your Life in 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !generating && handleGenerate()}
            />
          </div>

          {/* Style selector */}
          <div className="space-y-2">
            <Label>Style</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                    style === s.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-xs font-semibold">{s.label}</span>
                  <span className="text-[10px] text-muted-foreground">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={generating || !title.trim()}
              size="lg"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Thumbnails
              <Badge variant="outline" className="ml-2 text-xs font-normal">
                <Coins className="mr-1 h-3 w-3" />1 credit
              </Badge>
            </Button>
            {results.length > 0 && (
              <Button variant="outline" size="lg" onClick={handleGenerate} disabled={generating}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {generating && (
        <div className="grid gap-4 sm:grid-cols-3">
          {["YouTube (1280×720)", "Instagram (1080×1080)", "Stories (1080×1920)"].map((size) => (
            <Card key={size}>
              <CardContent className="py-8 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">{size}</p>
                <p className="text-xs text-muted-foreground mt-1">Generating...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Text Overlay Controls */}
      {!generating && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Text Overlay</CardTitle>
            <CardDescription>Customize the text shown on your thumbnails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Text</Label>
              <Input
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                placeholder="Your thumbnail title..."
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Size</Label>
                <Input
                  type="number"
                  min={16}
                  max={80}
                  value={overlayFontSize}
                  onChange={(e) => setOverlayFontSize(Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <Input
                  type="color"
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  className="h-8 p-1"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Position</Label>
                <select
                  value={overlayPosition}
                  onChange={(e) => setOverlayPosition(e.target.value as "top" | "center" | "bottom")}
                  className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Background</Label>
                <label className="flex items-center gap-2 h-8 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overlayBg}
                    onChange={(e) => setOverlayBg(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-xs">Dark bar</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!generating && results.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Generated Thumbnails</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {results.map((thumb) => (
              <Card key={thumb.id} className="overflow-hidden">
                <div
                  className="relative bg-muted overflow-hidden"
                  style={{
                    aspectRatio:
                      thumb.size === "Instagram"
                        ? "1/1"
                        : thumb.size === "Stories"
                          ? "9/16"
                          : "16/9",
                  }}
                >
                  <img
                    src={thumb.url}
                    alt={`${thumb.size} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                  {/* Text overlay */}
                  {overlayText && (
                    <div
                      className="absolute inset-x-0 flex justify-center px-3"
                      style={{
                        top: overlayPosition === "top" ? "8%" : overlayPosition === "center" ? "50%" : undefined,
                        bottom: overlayPosition === "bottom" ? "8%" : undefined,
                        transform: overlayPosition === "center" ? "translateY(-50%)" : undefined,
                      }}
                    >
                      <p
                        className="text-center font-bold leading-tight max-w-[90%]"
                        style={{
                          fontSize: `${Math.max(12, overlayFontSize * (thumb.size === "Stories" ? 0.5 : thumb.size === "Instagram" ? 0.6 : 0.4))}px`,
                          color: overlayColor,
                          backgroundColor: overlayBg ? "rgba(0,0,0,0.7)" : "transparent",
                          padding: overlayBg ? "6px 12px" : "0",
                          borderRadius: overlayBg ? "6px" : "0",
                          textShadow: overlayBg ? "none" : "2px 2px 4px rgba(0,0,0,0.8)",
                        }}
                      >
                        {overlayText}
                      </p>
                    </div>
                  )}
                  {thumbnailSet === thumb.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                      <Badge className="bg-primary text-primary-foreground">
                        <Check className="mr-1 h-3 w-3" />
                        Set as Thumbnail
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{thumb.size}</p>
                      <p className="text-xs text-muted-foreground">
                        {thumb.width}×{thumb.height}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = thumb.url;
                        a.download = `thumbnail-${thumb.size.toLowerCase()}.png`;
                        a.click();
                      }}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                    {videoId && (
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={settingThumbnail === thumb.url || thumbnailSet === thumb.url}
                        onClick={() => handleSetThumbnail(thumb.url)}
                      >
                        {settingThumbnail === thumb.url ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : thumbnailSet === thumb.url ? (
                          <Check className="mr-1 h-3 w-3" />
                        ) : (
                          <ImageIcon className="mr-1 h-3 w-3" />
                        )}
                        {thumbnailSet === thumb.url ? "Set!" : "Set Thumbnail"}
                      </Button>
                    )}
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

export default function ThumbnailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ThumbnailContent />
    </Suspense>
  );
}
