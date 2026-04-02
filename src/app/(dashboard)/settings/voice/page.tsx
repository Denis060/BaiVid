"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Mic,
  MicOff,
  Play,
  Pause,
  Star,
  Trash2,
  Upload,
  ChevronLeft,
  Plus,
  CheckCircle,
} from "lucide-react";
import {
  getVoiceProfiles,
  createVoiceProfile,
  savePresetVoice,
  setDefaultVoice,
  deleteVoiceProfile,
} from "@/actions/voice";
import { createClient } from "@/lib/supabase/client";
import type { VoiceProfile } from "@/types";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "sw", label: "Swahili" },
  { value: "yo", label: "Yoruba" },
  { value: "kri", label: "Krio" },
  { value: "ha", label: "Hausa" },
  { value: "ig", label: "Igbo" },
  { value: "am", label: "Amharic" },
];

const PRESET_VOICES = [
  { id: "alloy", name: "Alloy", desc: "Neutral, balanced", lang: "en", tags: ["Versatile"] },
  { id: "echo", name: "Echo", desc: "Warm, rich tone", lang: "en", tags: ["Narration"] },
  { id: "fable", name: "Fable", desc: "British accent, expressive", lang: "en", tags: ["Storytelling"] },
  { id: "onyx", name: "Onyx", desc: "Deep, authoritative", lang: "en", tags: ["Business"] },
  { id: "nova", name: "Nova", desc: "Bright, energetic female", lang: "en", tags: ["Social Media"] },
  { id: "shimmer", name: "Shimmer", desc: "Soft, calming", lang: "en", tags: ["Meditation"] },
  { id: "ash", name: "Ash", desc: "Casual male", lang: "en", tags: ["Conversational"] },
  { id: "ballad", name: "Ballad", desc: "Expressive storyteller", lang: "en", tags: ["Drama"] },
  { id: "coral", name: "Coral", desc: "Upbeat female", lang: "en", tags: ["Marketing"] },
  { id: "sage", name: "Sage", desc: "Wise, measured", lang: "en", tags: ["Education"] },
  { id: "verse", name: "Verse", desc: "Poetic, rhythmic", lang: "en", tags: ["Creative"] },
  { id: "ember", name: "Ember", desc: "Passionate, warm", lang: "en", tags: ["Lifestyle"] },
  { id: "aria", name: "Aria", desc: "Clear female soprano", lang: "en", tags: ["Professional"] },
  { id: "leo", name: "Leo", desc: "Confident male", lang: "en", tags: ["Leadership"] },
  { id: "mist", name: "Mist", desc: "Ethereal, dreamy", lang: "en", tags: ["ASMR"] },
  { id: "bolt", name: "Bolt", desc: "Fast, punchy delivery", lang: "en", tags: ["Shorts"] },
  { id: "reed", name: "Reed", desc: "Calm male narrator", lang: "en", tags: ["Documentary"] },
  { id: "ivy", name: "Ivy", desc: "Friendly, young female", lang: "en", tags: ["Gen Z"] },
  { id: "oak", name: "Oak", desc: "Deep, trustworthy", lang: "en", tags: ["Finance"] },
  { id: "dawn", name: "Dawn", desc: "Morning radio host vibe", lang: "en", tags: ["News"] },
  { id: "luna-es", name: "Luna", desc: "Natural Spanish", lang: "es", tags: ["Spanish"] },
  { id: "marc-fr", name: "Marc", desc: "Smooth French", lang: "fr", tags: ["French"] },
  { id: "hans-de", name: "Hans", desc: "Clear German", lang: "de", tags: ["German"] },
  { id: "yuki-ja", name: "Yuki", desc: "Japanese female", lang: "ja", tags: ["Japanese"] },
  { id: "ming-zh", name: "Ming", desc: "Mandarin Chinese", lang: "zh", tags: ["Chinese"] },
];

export default function VoiceSettingsPage() {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [newName, setNewName] = useState("");
  const [newLanguage, setNewLanguage] = useState("en");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sampleUrl, setSampleUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploadMode, setUploadMode] = useState<"record" | "upload">("record");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio playback
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getVoiceProfiles();
      setProfiles(data);
      setLoading(false);
    }
    load();
  }, []);

  // Recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });

        const supabase = createClient();
        const fileName = `voice_${Date.now()}.webm`;
        const { error } = await supabase.storage
          .from("voice_samples")
          .upload(fileName, blob, { upsert: true });

        if (!error) {
          const { data: publicUrl } = supabase.storage
            .from("voice_samples")
            .getPublicUrl(fileName);
          setSampleUrl(publicUrl.publicUrl);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 15) { stopRecording(); return 15; }
          return t + 1;
        });
      }, 1000);
    } catch {
      alert("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const fileName = `voice_${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage
      .from("voice_samples")
      .upload(fileName, file, { upsert: true });
    if (!error) {
      const { data: publicUrl } = supabase.storage
        .from("voice_samples")
        .getPublicUrl(fileName);
      setSampleUrl(publicUrl.publicUrl);
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !sampleUrl) return;
    setCreating(true);
    const result = await createVoiceProfile({
      name: newName.trim(),
      sampleUrl,
      language: newLanguage,
    });
    if (!result.error) {
      const updated = await getVoiceProfiles();
      setProfiles(updated);
      setShowCreate(false);
      setNewName("");
      setSampleUrl("");
    }
    setCreating(false);
  }

  async function handleSavePreset(preset: typeof PRESET_VOICES[0]) {
    const result = await savePresetVoice({
      name: preset.name,
      providerVoiceId: preset.id,
      language: preset.lang,
    });
    if (!result.error) {
      const updated = await getVoiceProfiles();
      setProfiles(updated);
    }
  }

  async function handleSetDefault(id: string) {
    await setDefaultVoice(id);
    setProfiles((prev) =>
      prev.map((p) => ({ ...p, is_default: p.id === id }))
    );
  }

  async function handleDelete(id: string) {
    await deleteVoiceProfile(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }

  function togglePlay(url: string | null, id: string) {
    if (!url) return;
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(id);
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
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Voice Profiles</h1>
            <p className="text-muted-foreground mt-1">
              Clone your voice or pick from AI presets.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Clone Voice
          </Button>
        </div>
      </div>

      {/* Saved Profiles */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          My Voices ({profiles.length})
        </h2>
        {profiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mic className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No voice profiles yet. Clone your voice or add a preset below.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {profiles.map((profile) => (
              <Card key={profile.id} className={profile.is_default ? "border-primary/30" : ""}>
                <CardContent className="flex items-center gap-4 py-4">
                  <button
                    type="button"
                    onClick={() => togglePlay(profile.sample_url, profile.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-accent shrink-0"
                  >
                    {playingId === profile.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{profile.name}</p>
                      {profile.is_default && (
                        <Badge className="bg-primary/10 text-primary text-[10px]">Default</Badge>
                      )}
                      {profile.provider_voice_id === "pending" && (
                        <Badge className="bg-yellow-500/10 text-yellow-500 text-[10px]">
                          <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />Cloning...
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {profile.provider} &middot; {LANGUAGES.find((l) => l.value === profile.language)?.label || profile.language}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!profile.is_default && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Set as default"
                        onClick={() => handleSetDefault(profile.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Delete"
                      onClick={() => handleDelete(profile.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preset Voices */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          AI Preset Voices ({PRESET_VOICES.length})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PRESET_VOICES.map((preset) => {
            const isSaved = profiles.some((p) => p.provider_voice_id === preset.id);
            return (
              <Card key={preset.id} className={isSaved ? "border-primary/20 opacity-70" : ""}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                    {preset.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{preset.name}</p>
                    <p className="text-[10px] text-muted-foreground">{preset.desc}</p>
                    <div className="flex gap-1 mt-0.5">
                      {preset.tags.map((tag) => (
                        <span key={tag} className="text-[9px] rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isSaved ? (
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSavePreset(preset)}
                    >
                      Add
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Clone Voice Dialog */}
      {showCreate && (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Clone Your Voice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Name</Label>
                <Input
                  placeholder="e.g. My Voice, Business Tone"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={newLanguage} onValueChange={(v) => v && setNewLanguage(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Record or Upload toggle */}
              <div className="flex gap-2">
                <Button
                  variant={uploadMode === "record" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadMode("record")}
                >
                  <Mic className="mr-2 h-3 w-3" />Record
                </Button>
                <Button
                  variant={uploadMode === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadMode("upload")}
                >
                  <Upload className="mr-2 h-3 w-3" />Upload
                </Button>
              </div>

              {uploadMode === "record" ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isRecording ? "bg-destructive/20 animate-pulse" : sampleUrl ? "bg-primary/20" : "bg-muted"}`}>
                    {isRecording ? <MicOff className="h-6 w-6 text-destructive" /> : sampleUrl ? <CheckCircle className="h-6 w-6 text-primary" /> : <Mic className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  {isRecording && (
                    <p className="text-sm font-medium tabular-nums">{recordingTime}s / 15s</p>
                  )}
                  {sampleUrl && !isRecording && (
                    <p className="text-xs text-primary">Sample recorded!</p>
                  )}
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? "Stop" : sampleUrl ? "Re-record" : "Start Recording"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Read a paragraph for 10-15 seconds. Speak clearly and naturally.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary/50">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {sampleUrl ? "File uploaded!" : "MP3, WAV, or WebM (max 10MB)"}
                    </p>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={creating || !newName.trim() || !sampleUrl}
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
                Clone Voice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
