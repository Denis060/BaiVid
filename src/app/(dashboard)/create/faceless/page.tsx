"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Coins,
  ChevronLeft,
  ChevronRight,
  FileText,
  Palette,
  Mic,
  Clock,
  CheckCircle,
  Clapperboard,
  Film,
  Sparkles,
  Minimize2,
  Bold,
  Camera,
  Layers,
  Coffee,
  Music,
} from "lucide-react";
import { createFacelessVideo } from "@/actions/videos";
import { getUserScripts } from "@/actions/scripts";
import { useCreditsStore } from "@/stores/credits-store";
import { GOOGLE_TTS_VOICES, type GoogleTTSVoice } from "@/lib/providers/google-tts";
import { FISH_AUDIO_PRESETS } from "@/lib/providers/fish-audio";
import { generateVoicePreview } from "@/actions/voice-preview";
import { CAPTION_STYLES } from "@/lib/caption-styles";
import type { Script } from "@/types";

import {
  Play,
  Pause,
  Volume2,
} from "lucide-react";

const VOICE_LANGUAGE_TABS = [
  { code: "en", label: "English", flag: "🇺🇸🇬🇧" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "yo", label: "Yoruba", flag: "🇳🇬" },
  { code: "sw", label: "Swahili", flag: "🇹🇿" },
  { code: "af", label: "Afrikaans", flag: "🇿🇦" },
];

const STEPS = [
  { label: "Script", icon: FileText },
  { label: "Art Style", icon: Palette },
  { label: "Voice", icon: Mic },
  { label: "Captions", icon: Layers },
  { label: "Settings", icon: Clock },
  { label: "Review", icon: CheckCircle },
];

const ART_STYLES = [
  { id: "cinematic", label: "Cinematic", icon: <Clapperboard className="h-5 w-5" />, desc: "Film-like, dramatic lighting" },
  { id: "minimal", label: "Minimal", icon: <Minimize2 className="h-5 w-5" />, desc: "Clean, simple visuals" },
  { id: "bold", label: "Bold", icon: <Bold className="h-5 w-5" />, desc: "High contrast, vibrant" },
  { id: "documentary", label: "Documentary", icon: <Camera className="h-5 w-5" />, desc: "Realistic, journalistic" },
  { id: "animated", label: "Animated", icon: <Layers className="h-5 w-5" />, desc: "Cartoon, motion graphics" },
  { id: "lofi", label: "Lo-fi", icon: <Coffee className="h-5 w-5" />, desc: "Warm, nostalgic aesthetic" },
  { id: "afrobeat", label: "Afrobeat", icon: <Music className="h-5 w-5" />, desc: "Colorful, rhythmic, African-inspired" },
];

const DURATIONS = [
  { value: 30, label: "30s", desc: "Quick clip" },
  { value: 60, label: "60s", desc: "Standard short" },
  { value: 90, label: "90s", desc: "Extended short" },
  { value: 180, label: "3 min", desc: "Long form" },
];

const ASPECT_RATIOS = [
  { value: "16:9" as const, label: "16:9", desc: "YouTube / Landscape" },
  { value: "9:16" as const, label: "9:16", desc: "TikTok / Reels" },
  { value: "1:1" as const, label: "1:1", desc: "Instagram / Square" },
];

export default function FacelessCreatePage() {
  const [step, setStep] = useState(0);
  const { credits } = useCreditsStore();

  // Form state
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [artStyle, setArtStyle] = useState("cinematic");
  const [voiceId, setVoiceId] = useState<string>("google-en-male-1");
  const [voiceLangTab, setVoiceLangTab] = useState("en");
  const [duration, setDuration] = useState(60);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("9:16");

  const [captionStyle, setCaptionStyle] = useState("highlight");

  // Voice preview
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [savedScripts, setSavedScripts] = useState<Script[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const durationMinutes = Math.max(1, Math.ceil(duration / 60));
  const creditCost = 13 * durationMinutes;

  useEffect(() => {
    if (step === 0 && savedScripts.length === 0) {
      setLoadingScripts(true);
      getUserScripts(1, 20).then((res) => {
        setSavedScripts(res.scripts);
        setLoadingScripts(false);
      });
    }
  }, [step, savedScripts.length]);

  async function handleVoicePreview(id: string) {
    if (playingVoice === id) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      return;
    }
    setPreviewingVoice(id);
    const result = await generateVoicePreview(id);
    if ("audioUrl" in result) {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(result.audioUrl);
      audio.onended = () => setPlayingVoice(null);
      audio.play();
      audioRef.current = audio;
      setPlayingVoice(id);
    }
    setPreviewingVoice(null);
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return script.trim().length >= 10 && title.trim().length >= 2;
      case 1: return !!artStyle;
      case 2: return !!voiceId;
      case 3: return !!captionStyle;
      case 4: return !!duration && !!aspectRatio;
      case 5: return credits >= creditCost;
      default: return false;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const result = await createFacelessVideo({
        title,
        script,
        artStyle,
        voiceId,
        duration,
        aspectRatio,
      });
      if (result?.error) {
        setError(result.error);
        setSubmitting(false);
      }
      // On success, redirect happens in the server action
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  function importScript(s: Script) {
    setTitle(s.title);
    setScript(s.content);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Faceless Video</h1>
        <p className="text-muted-foreground mt-1">
          Generate a video with AI visuals, voiceover, and captions.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          {STEPS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 ${
                i === step
                  ? "text-primary font-medium"
                  : i < step
                    ? "text-foreground cursor-pointer"
                    : "text-muted-foreground"
              }`}
              disabled={i > step}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 0: Script */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Script</CardTitle>
            <CardDescription>
              Write your script or import from a saved one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title</Label>
              <Input
                id="title"
                placeholder="e.g. 5 AI Tools Every Creator Needs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="script">Script Content</Label>
              <Textarea
                id="script"
                placeholder="Paste or write your video script here..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {script.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>

            {/* Import from saved */}
            {savedScripts.length > 0 && (
              <div className="space-y-2">
                <Label>Or import from saved scripts</Label>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {savedScripts.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => importScript(s)}
                      className="flex items-center gap-2 rounded-lg border border-border p-2 text-left text-sm hover:bg-accent transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{s.title}</span>
                      {s.word_count && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {s.word_count}w
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loadingScripts && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading saved scripts...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Art Style */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Art Style</CardTitle>
            <CardDescription>
              Choose the visual style for your video scenes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {ART_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setArtStyle(style.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    artStyle === style.id
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {style.icon}
                  <span className="text-sm font-medium">{style.label}</span>
                  <span className="text-xs opacity-70">{style.desc}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Voice */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Voice</CardTitle>
            <CardDescription>
              Select a voice for the AI narration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* African voices banner */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
              <span className="font-medium">🌍 Baivid exclusive:</span>{" "}
              <span className="text-muted-foreground">African language voices — Yoruba, Swahili &amp; Afrikaans</span>
            </div>

            {/* Language tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {VOICE_LANGUAGE_TABS.map((tab) => (
                <button
                  key={tab.code}
                  type="button"
                  onClick={() => setVoiceLangTab(tab.code)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    voiceLangTab === tab.code
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{tab.flag}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Google TTS voices for selected language */}
            <div className="grid gap-2">
              {GOOGLE_TTS_VOICES
                .filter((v) => v.languageCode.startsWith(voiceLangTab))
                .map((voice) => (
                  <div
                    key={voice.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                      voiceId === voice.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setVoiceId(voice.id)}
                  >
                    {/* Play preview button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleVoicePreview(voice.id); }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-accent shrink-0 transition-colors"
                      title="Preview voice"
                    >
                      {previewingVoice === voice.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : playingVoice === voice.id ? (
                        <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{voice.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">{voice.language}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {voice.gender === "MALE" ? "Male" : "Female"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            voice.tier === "neural2"
                              ? "border-primary/30 text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {voice.tier === "neural2" ? "Neural2" : "Standard"}
                        </Badge>
                      </div>
                    </div>
                    {voiceId === voice.id && (
                      <CheckCircle className="ml-auto h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                ))}

              {GOOGLE_TTS_VOICES.filter((v) => v.languageCode.startsWith(voiceLangTab)).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No voices available for this language yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Caption Style */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Caption Style</CardTitle>
            <CardDescription>
              Choose how your captions will look in the video.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CAPTION_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setCaptionStyle(style.id)}
                  className={`relative rounded-xl border p-4 text-left transition-all ${
                    captionStyle === style.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {/* Preview area */}
                  <div className="bg-muted/50 rounded-lg p-3 mb-3 min-h-[60px] flex items-center justify-center">
                    <p
                      className="text-xs text-center leading-relaxed"
                      style={{
                        color: style.primaryColor,
                        fontFamily: style.fontFamily,
                      }}
                    >
                      This is how your{" "}
                      <span
                        style={{
                          backgroundColor:
                            style.animation === "highlight"
                              ? style.primaryColor
                              : undefined,
                          color:
                            style.animation === "highlight"
                              ? "#000"
                              : style.primaryColor,
                          fontWeight: "bold",
                          padding: style.animation === "wordbox" ? "1px 4px" : undefined,
                          border: style.animation === "wordbox" ? `1px solid ${style.primaryColor}` : undefined,
                          borderRadius: style.animation === "wordbox" ? "4px" : undefined,
                        }}
                      >
                        captions
                      </span>{" "}
                      will look.
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{style.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {style.description.split(".")[0]}
                  </p>
                  {captionStyle === style.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Duration + Aspect Ratio */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Choose duration and aspect ratio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Duration</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDuration(d.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
                      duration === d.value
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="text-lg font-bold">{d.label}</span>
                    <span className="text-xs">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Aspect Ratio</Label>
              <div className="grid grid-cols-3 gap-3">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.value}
                    type="button"
                    onClick={() => setAspectRatio(ar.value)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                      aspectRatio === ar.value
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <div
                      className={`border-2 rounded ${
                        aspectRatio === ar.value
                          ? "border-primary"
                          : "border-muted-foreground"
                      }`}
                      style={{
                        width: ar.value === "9:16" ? 24 : ar.value === "1:1" ? 32 : 40,
                        height: ar.value === "9:16" ? 40 : ar.value === "1:1" ? 32 : 24,
                      }}
                    />
                    <span className="text-sm font-medium">{ar.label}</span>
                    <span className="text-xs opacity-70">{ar.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Create</CardTitle>
            <CardDescription>
              Confirm your settings before creating the video.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Title</span>
                <span className="font-medium">{title}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Script</span>
                <span className="font-medium">
                  {script.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Art Style</span>
                <span className="font-medium capitalize">{artStyle}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Voice</span>
                <span className="font-medium">
                  {GOOGLE_TTS_VOICES.find((v) => v.id === voiceId)?.name ||
                    FISH_AUDIO_PRESETS.find((v) => v.id === voiceId)?.name ||
                    voiceId}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Captions</span>
                <span className="font-medium capitalize">
                  {CAPTION_STYLES.find((s) => s.id === captionStyle)?.name || captionStyle}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">
                  {DURATIONS.find((d) => d.value === duration)?.label}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Aspect Ratio</span>
                <span className="font-medium">{aspectRatio}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Credit Cost</span>
                <Badge className="bg-primary/10 text-primary">
                  <Coins className="mr-1 h-3 w-3" />
                  {creditCost} credits
                </Badge>
              </div>
            </div>

            {credits < creditCost && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Insufficient credits. You have {credits} but need {creditCost}.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            size="lg"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Film className="mr-2 h-4 w-4" />
            )}
            Create Video
            <Badge variant="outline" className="ml-2 text-xs font-normal">
              <Coins className="mr-1 h-3 w-3" />
              {creditCost}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
}
