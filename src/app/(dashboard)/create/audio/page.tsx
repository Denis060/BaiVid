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
import {
  Loader2,
  Upload,
  Music,
  Coins,
  Film,
  CheckCircle,
} from "lucide-react";
import { createAudioVideo } from "@/actions/videos";
import { useCreditsStore } from "@/stores/credits-store";
import { createClient } from "@/lib/supabase/client";

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

export default function AudioVideoPage() {
  const { credits } = useCreditsStore();
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);
  const [artStyle, setArtStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("9:16");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const durationMinutes = Math.max(1, Math.ceil(audioDuration / 60));
  const creditCost = 12 * durationMinutes;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    // Get audio duration
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadedmetadata = () => {
      setAudioDuration(Math.round(audio.duration));
    };

    // Upload to Supabase
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `audio_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("voice_samples")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError("Upload failed: " + uploadError.message);
    } else {
      const { data } = supabase.storage.from("voice_samples").getPublicUrl(fileName);
      setAudioUrl(data.publicUrl);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    }
    setUploading(false);
  }

  async function handleSubmit() {
    if (!audioUrl || !title.trim()) return;
    setSubmitting(true);
    setError("");
    const result = await createAudioVideo({
      title: title.trim(),
      audioUrl,
      artStyle,
      aspectRatio,
      durationSeconds: audioDuration,
    });
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audio to Video</h1>
        <p className="text-muted-foreground mt-1">
          Upload a podcast or audio file and we&apos;ll generate matching visuals.
        </p>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Audio</CardTitle>
          <CardDescription>MP3, WAV, or M4A up to 500MB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {audioUrl ? (
            <div className="flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <CheckCircle className="h-6 w-6 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Audio uploaded</p>
                <p className="text-xs text-muted-foreground">
                  Duration: {Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, "0")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setAudioUrl(""); setAudioDuration(0); }}>
                Change
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-12 cursor-pointer hover:border-primary/50 transition-colors">
              {uploading ? (
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-10 w-10 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload audio"}</p>
              <p className="text-xs text-muted-foreground">MP3, WAV, M4A up to 500MB</p>
              <input type="file" accept="audio/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          )}

          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Video title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </CardContent>
      </Card>

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

      {/* Aspect Ratio */}
      <Card>
        <CardHeader><CardTitle>Aspect Ratio</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {ASPECT_RATIOS.map((ar) => (
              <button key={ar.value} type="button" onClick={() => setAspectRatio(ar.value)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${aspectRatio === ar.value ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
              >
                <span className="text-sm font-bold">{ar.label}</span>
                <span className="text-xs text-muted-foreground">{ar.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <Button onClick={handleSubmit} disabled={submitting || !audioUrl || !title.trim() || credits < creditCost} size="lg" className="w-full">
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
        Generate Video
        <Badge variant="outline" className="ml-2 text-xs font-normal">
          <Coins className="mr-1 h-3 w-3" />{audioDuration > 0 ? creditCost : "10/min"} credits
        </Badge>
      </Button>
    </div>
  );
}
