"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Upload,
  Camera,
  Mic,
  MicOff,
  FileText,
  CheckCircle,
  User,
  Film,
  Clock,
  Tv,
  BookOpen,
  Radio,
} from "lucide-react";
import { createAvatarVideo } from "@/actions/videos";
import { getUserScripts } from "@/actions/scripts";
import { useCreditsStore } from "@/stores/credits-store";
import { createClient } from "@/lib/supabase/client";
import type { Script } from "@/types";

const STEPS = [
  { label: "Photo", icon: Camera },
  { label: "Voice", icon: Mic },
  { label: "Style", icon: Tv },
  { label: "Script", icon: FileText },
  { label: "Review", icon: CheckCircle },
];

const STYLES = [
  { id: "solo_host" as const, label: "Solo Host", icon: <User className="h-5 w-5" />, desc: "Direct-to-camera presenter" },
  { id: "interview" as const, label: "Interview", icon: <Radio className="h-5 w-5" />, desc: "Conversational, natural" },
  { id: "news_anchor" as const, label: "News Anchor", icon: <Tv className="h-5 w-5" />, desc: "Professional, formal" },
  { id: "storyteller" as const, label: "Storyteller", icon: <BookOpen className="h-5 w-5" />, desc: "Expressive, engaging" },
];

const DURATIONS = [
  { value: 30, label: "30s" },
  { value: 60, label: "1 min" },
  { value: 120, label: "2 min" },
  { value: 180, label: "3 min" },
];

export default function AvatarCreatePage() {
  const [step, setStep] = useState(0);
  const { credits } = useCreditsStore();

  // Form state
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [voiceSampleUrl, setVoiceSampleUrl] = useState("");
  const [style, setStyle] = useState<"solo_host" | "interview" | "news_anchor" | "storyteller">("solo_host");
  const [duration, setDuration] = useState(60);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [savedScripts, setSavedScripts] = useState<Script[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);

  const durationMinutes = Math.max(1, Math.ceil(duration / 60));
  const creditCost = 20 * durationMinutes;

  useEffect(() => {
    if (step === 3 && savedScripts.length === 0) {
      setLoadingScripts(true);
      getUserScripts(1, 20).then((res) => {
        setSavedScripts(res.scripts);
        setLoadingScripts(false);
      });
    }
  }, [step, savedScripts.length]);

  // Photo upload
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setPhotoUrl(publicUrl.publicUrl);
      setPhotoPreview(URL.createObjectURL(file));
    } catch (err) {
      setError("Failed to upload photo. Please try again.");
      console.error(err);
    }
    setUploading(false);
  }

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        // Upload to Supabase
        const supabase = createClient();
        const fileName = `voice_${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("voice_samples")
          .upload(fileName, blob, { upsert: true });

        if (!uploadError) {
          const { data: publicUrl } = supabase.storage
            .from("voice_samples")
            .getPublicUrl(fileName);
          setVoiceSampleUrl(publicUrl.publicUrl);
          setHasRecording(true);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 10) {
            stopRecording();
            return 10;
          }
          return t + 1;
        });
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  function canProceed(): boolean {
    switch (step) {
      case 0: return !!photoUrl;
      case 1: return true; // Voice is optional
      case 2: return !!style;
      case 3: return script.trim().length >= 10 && title.trim().length >= 2;
      case 4: return credits >= creditCost;
      default: return false;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const result = await createAvatarVideo({
        title,
        script,
        photoUrl,
        voiceSampleUrl: voiceSampleUrl || undefined,
        style,
        duration,
      });
      if (result?.error) {
        setError(result.error);
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Avatar Video</h1>
        <p className="text-muted-foreground mt-1">
          Generate a talking avatar video with AI lip-sync.
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

      {/* Step 0: Photo */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Photo</CardTitle>
            <CardDescription>
              Upload a clear, front-facing photo for your avatar. JPG or PNG, at least 512x512.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {photoPreview ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-48 w-48 rounded-xl overflow-hidden border-2 border-primary">
                  <img
                    src={photoPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhotoUrl("");
                    setPhotoPreview("");
                  }}
                >
                  Change Photo
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-12 cursor-pointer hover:border-primary/50 transition-colors">
                {uploading ? (
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {uploading ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG up to 10MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1: Voice Recording */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Voice Sample (Optional)</CardTitle>
            <CardDescription>
              Record a 10-second voice sample to clone your voice. Skip to use a default AI voice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              {/* Recording UI */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-full transition-all ${
                    isRecording
                      ? "bg-destructive/20 animate-pulse"
                      : hasRecording
                        ? "bg-primary/20"
                        : "bg-muted"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="h-8 w-8 text-destructive" />
                  ) : hasRecording ? (
                    <CheckCircle className="h-8 w-8 text-primary" />
                  ) : (
                    <Mic className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {isRecording && (
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">
                      {recordingTime}s / 10s
                    </p>
                    <Progress
                      value={(recordingTime / 10) * 100}
                      className="h-1.5 w-40 mt-2"
                    />
                  </div>
                )}

                {hasRecording && !isRecording && (
                  <p className="text-sm text-primary font-medium">
                    Voice sample recorded!
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {isRecording ? (
                  <Button variant="destructive" onClick={stopRecording}>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                ) : (
                  <Button onClick={startRecording}>
                    <Mic className="mr-2 h-4 w-4" />
                    {hasRecording ? "Re-record" : "Start Recording"}
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center max-w-sm">
                Speak clearly for 10 seconds. Read a paragraph or describe your day.
                The AI will learn your voice patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Style */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Presentation Style</CardTitle>
            <CardDescription>
              Choose how your avatar presents the content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all ${
                    style === s.id
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {s.icon}
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="text-xs opacity-70">{s.desc}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Script + Duration */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Script & Duration</CardTitle>
            <CardDescription>
              Write what your avatar will say.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Video Title</Label>
              <Input
                id="title"
                placeholder="e.g. Product Demo Introduction"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="script">Script</Label>
              <Textarea
                id="script"
                placeholder="Write what your avatar will say..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="min-h-[160px]"
              />
              <p className="text-xs text-muted-foreground">
                {script.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>

            {/* Import from saved */}
            {savedScripts.length > 0 && (
              <div className="space-y-2">
                <Label>Import from saved scripts</Label>
                <div className="grid gap-2 max-h-32 overflow-y-auto">
                  {savedScripts.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setTitle(s.title);
                        setScript(s.content);
                      }}
                      className="flex items-center gap-2 rounded-lg border border-border p-2 text-left text-sm hover:bg-accent transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loadingScripts && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading scripts...
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDuration(d.value)}
                    className={`rounded-lg border p-3 text-center text-sm font-medium transition-all ${
                      duration === d.value
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Create</CardTitle>
            <CardDescription>
              Confirm your settings before creating the avatar video.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Photo</span>
                <div className="flex items-center gap-2">
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  )}
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Voice</span>
                <span className="font-medium">
                  {hasRecording ? "Custom recording" : "Default AI voice"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Style</span>
                <span className="font-medium capitalize">
                  {STYLES.find((s) => s.id === style)?.label}
                </span>
              </div>
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
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">
                  {DURATIONS.find((d) => d.value === duration)?.label}
                </span>
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
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
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
            Create Avatar Video
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
