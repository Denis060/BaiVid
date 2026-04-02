"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Play,
  Pause,
  Scissors,
  Type,
  Music,
  Layers,
  Coins,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { getVideoForEditor, submitRerender, getMusicLibrary } from "@/actions/editor";
import type { Video } from "@/types";
import type {
  EditInstruction,
  TrimInstruction,
  TextOverlay,
  MusicSwap,
  Transition,
} from "@/lib/editor-types";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Edit state
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<{ url: string; name: string } | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [transition, setTransition] = useState<"cut" | "fade" | "slide" | "dissolve">("cut");
  const [musicTracks, setMusicTracks] = useState<{ id: string; name: string; genre: string; url: string }[]>([]);

  // New text overlay form
  const [newText, setNewText] = useState("");
  const [newPosition, setNewPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [newFontSize, setNewFontSize] = useState(32);
  const [newFontColor, setNewFontColor] = useState("#ffffff");

  useEffect(() => {
    async function load() {
      const [v, tracks] = await Promise.all([
        getVideoForEditor(videoId),
        getMusicLibrary(),
      ]);
      if (v) {
        setVideo(v);
        setTrimEnd(v.duration || 0);
        setDuration(v.duration || 0);
      }
      setMusicTracks(tracks);
      setLoading(false);
    }
    load();
  }, [videoId]);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  }

  function handleTimeUpdate() {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }

  function seekTo(time: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }

  function addTextOverlay() {
    if (!newText.trim()) return;
    setTextOverlays((prev) => [
      ...prev,
      {
        type: "text",
        text: newText.trim(),
        startTime: currentTime,
        endTime: Math.min(currentTime + 5, duration),
        position: newPosition,
        fontSize: newFontSize,
        fontColor: newFontColor,
      },
    ]);
    setNewText("");
  }

  function removeTextOverlay(index: number) {
    setTextOverlays((prev) => prev.filter((_, i) => i !== index));
  }

  function buildInstructions(): EditInstruction[] {
    const instructions: EditInstruction[] = [];

    // Trim (only if changed from original)
    if (trimStart > 0 || trimEnd < duration) {
      instructions.push({ type: "trim", startTime: trimStart, endTime: trimEnd });
    }

    // Text overlays
    instructions.push(...textOverlays);

    // Music swap
    if (selectedMusic) {
      instructions.push({
        type: "music",
        musicUrl: selectedMusic.url,
        musicName: selectedMusic.name,
        volume: musicVolume,
      });
    }

    // Transition
    if (transition !== "cut") {
      instructions.push({
        type: "transition",
        style: transition,
        atTime: trimStart,
        durationMs: 500,
      });
    }

    return instructions;
  }

  async function handleSubmit() {
    const instructions = buildInstructions();
    if (instructions.length === 0) {
      setError("No edits to apply");
      return;
    }

    setSubmitting(true);
    setError("");
    const result = await submitRerender(videoId, instructions);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      router.push("/videos");
    }
  }

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Video not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/videos")}>
          Back to Videos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/videos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{video.title}</h1>
            <p className="text-xs text-muted-foreground">
              {formatTime(duration)} &middot; {video.type} &middot; {video.aspect_ratio}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-4 w-4" />}
          Re-render
          <Badge variant="outline" className="ml-2 text-xs"><Coins className="mr-1 h-3 w-3" />5</Badge>
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Video Preview */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="overflow-hidden">
            <div className="relative bg-black">
              {video.video_url ? (
                <video
                  ref={videoRef}
                  src={video.video_url}
                  className="w-full aspect-video"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      setDuration(videoRef.current.duration);
                      setTrimEnd(videoRef.current.duration);
                    }
                  }}
                  onEnded={() => setPlaying(false)}
                />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center text-muted-foreground">
                  No video preview available
                </div>
              )}
            </div>

            {/* Controls */}
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon-sm" onClick={togglePlay}>
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </Button>
                <span className="text-xs tabular-nums text-muted-foreground min-w-[80px]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="flex-1 h-1.5 accent-primary"
                />
              </div>

              {/* Timeline visualization */}
              <div className="space-y-1">
                {/* Video track */}
                <div className="relative h-6 rounded bg-primary/20 overflow-hidden">
                  <div
                    className="absolute h-full bg-primary/40"
                    style={{
                      left: `${(trimStart / duration) * 100}%`,
                      width: `${((trimEnd - trimStart) / duration) * 100}%`,
                    }}
                  />
                  <div
                    className="absolute top-0 w-0.5 h-full bg-primary"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                  <span className="absolute left-1 top-0.5 text-[9px] text-primary-foreground">Video</span>
                </div>

                {/* Text overlay track */}
                <div className="relative h-4 rounded bg-blue-500/10 overflow-hidden">
                  {textOverlays.map((overlay, i) => (
                    <div
                      key={i}
                      className="absolute h-full bg-blue-500/30 border border-blue-500/50 rounded-sm"
                      style={{
                        left: `${(overlay.startTime / duration) * 100}%`,
                        width: `${((overlay.endTime - overlay.startTime) / duration) * 100}%`,
                      }}
                      title={overlay.text}
                    />
                  ))}
                  <span className="absolute left-1 top-0 text-[8px] text-muted-foreground">Text</span>
                </div>

                {/* Audio track */}
                <div className="relative h-4 rounded bg-green-500/10 overflow-hidden">
                  {selectedMusic && (
                    <div className="absolute inset-0 bg-green-500/20 border border-green-500/30 rounded-sm" />
                  )}
                  <span className="absolute left-1 top-0 text-[8px] text-muted-foreground">Audio</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Panel */}
        <div>
          <Tabs defaultValue="trim">
            <TabsList className="w-full">
              <TabsTrigger value="trim"><Scissors className="mr-1 h-3 w-3" />Trim</TabsTrigger>
              <TabsTrigger value="text"><Type className="mr-1 h-3 w-3" />Text</TabsTrigger>
              <TabsTrigger value="music"><Music className="mr-1 h-3 w-3" />Music</TabsTrigger>
              <TabsTrigger value="fx"><Layers className="mr-1 h-3 w-3" />FX</TabsTrigger>
            </TabsList>

            {/* Trim */}
            <TabsContent value="trim" className="mt-3 space-y-3">
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Start</Label>
                      <Input
                        type="number"
                        min={0}
                        max={trimEnd}
                        step={0.1}
                        value={trimStart}
                        onChange={(e) => setTrimStart(Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End</Label>
                      <Input
                        type="number"
                        min={trimStart}
                        max={duration}
                        step={0.1}
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setTrimStart(currentTime)}>
                      Set Start
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setTrimEnd(currentTime)}>
                      Set End
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Duration: {formatTime(trimEnd - trimStart)}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Text Overlays */}
            <TabsContent value="text" className="mt-3 space-y-3">
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <Input
                    placeholder="Enter text..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={newPosition} onValueChange={(v) => v && setNewPosition(v as "top" | "center" | "bottom")}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={newFontSize}
                      onChange={(e) => setNewFontSize(Number(e.target.value))}
                      min={12}
                      max={72}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="color"
                      value={newFontColor}
                      onChange={(e) => setNewFontColor(e.target.value)}
                      className="h-8 p-1"
                    />
                  </div>
                  <Button size="sm" onClick={addTextOverlay} disabled={!newText.trim()} className="w-full">
                    <Plus className="mr-1 h-3 w-3" />Add at {formatTime(currentTime)}
                  </Button>
                </CardContent>
              </Card>

              {textOverlays.length > 0 && (
                <div className="space-y-1">
                  {textOverlays.map((overlay, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs">
                      <span className="flex-1 truncate">{overlay.text}</span>
                      <span className="text-muted-foreground shrink-0">
                        {formatTime(overlay.startTime)}-{formatTime(overlay.endTime)}
                      </span>
                      <Button variant="ghost" size="icon-xs" onClick={() => removeTextOverlay(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Music */}
            <TabsContent value="music" className="mt-3 space-y-3">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Music Library</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                  {musicTracks.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setSelectedMusic({ url: track.url, name: track.name })}
                      className={`w-full flex items-center gap-2 rounded-lg p-2 text-left text-xs transition-colors ${
                        selectedMusic?.name === track.name
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-accent"
                      }`}
                    >
                      <Music className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="flex-1">{track.name}</span>
                      <Badge variant="outline" className="text-[9px]">{track.genre}</Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {selectedMusic && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{selectedMusic.name}</span>
                    <Button variant="ghost" size="icon-xs" onClick={() => setSelectedMusic(null)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Volume: {Math.round(musicVolume * 100)}%</Label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(Number(e.target.value))}
                      className="w-full h-1.5 accent-primary"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Transitions */}
            <TabsContent value="fx" className="mt-3">
              <Card>
                <CardContent className="pt-4">
                  <Label className="text-xs mb-2 block">Transition Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["cut", "fade", "slide", "dissolve"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTransition(t)}
                        className={`rounded-lg border p-3 text-center text-xs font-medium capitalize transition-all ${
                          transition === t
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
