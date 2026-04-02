"use client";

import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Pause,
  Play,
  Settings,
  Globe,
  Mic,
  Palette,
  Clock,
  Shield,
  Tag,
  Languages,
  Layers,
} from "lucide-react";
import {
  saveAutopilotProfile,
  getAutopilotProfile,
  toggleAutopilot,
  getAutopilotRuns,
} from "@/actions/autopilot";
import { PLATFORM_CONFIG, type PlatformKey } from "@/lib/publishers/types";
import { FISH_AUDIO_PRESETS } from "@/lib/providers/fish-audio";

type WizardView = "loading" | "wizard" | "dashboard";

const WIZARD_STEPS = [
  { label: "Name", icon: Zap },
  { label: "Niche", icon: Tag },
  { label: "Keywords", icon: Tag },
  { label: "Platforms", icon: Globe },
  { label: "Frequency", icon: Clock },
  { label: "Video Type", icon: Layers },
  { label: "Art Style", icon: Palette },
  { label: "Voice", icon: Mic },
  { label: "Duration", icon: Clock },
  { label: "Approval", icon: Shield },
  { label: "Review", icon: CheckCircle },
];

const NICHES = [
  "Technology", "Finance", "Health & Fitness", "Education", "Entertainment",
  "Lifestyle", "Business", "Gaming", "Food & Cooking", "Travel",
  "Fashion", "Music", "Sports", "Science", "Motivation",
];

const ART_STYLES = [
  "cinematic", "minimal", "bold", "documentary", "animated", "lofi", "afrobeat",
];

const FREQUENCIES = [
  { value: "daily", label: "Daily", desc: "1 video per day" },
  { value: "weekdays", label: "Weekdays", desc: "Mon-Fri" },
  { value: "3x_week", label: "3x/week", desc: "Mon, Wed, Fri" },
  { value: "weekly", label: "Weekly", desc: "Once a week" },
];

export default function AutopilotPage() {
  const [view, setView] = useState<WizardView>("loading");
  const [step, setStep] = useState(0);

  // Wizard state
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [keywords, setKeywords] = useState("");
  const [platforms, setPlatforms] = useState<PlatformKey[]>([]);
  const [frequency, setFrequency] = useState("daily");
  const [videoType, setVideoType] = useState<"faceless" | "avatar">("faceless");
  const [artStyle, setArtStyle] = useState("cinematic");
  const [voiceId, setVoiceId] = useState<string>(FISH_AUDIO_PRESETS[0].id);
  const [durationPref, setDurationPref] = useState("60s");
  const [approvalMode, setApprovalMode] = useState("approve");
  const [language, setLanguage] = useState("en");

  // Dashboard state
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getAutopilotProfile>>>(null);
  const [runs, setRuns] = useState<Awaited<ReturnType<typeof getAutopilotRuns>>>([]);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const p = await getAutopilotProfile();
      if (p) {
        setProfile(p);
        // Pre-fill wizard for editing
        setName(p.name);
        setNiche(p.niche);
        setKeywords((p.keywords || []).join(", "));
        setPlatforms((p.target_platforms || []) as PlatformKey[]);
        setFrequency(p.posting_frequency);
        setVideoType(p.video_type as "faceless" | "avatar");
        setArtStyle(p.art_style || "cinematic");
        setDurationPref(p.duration_pref || "60s");
        setApprovalMode(p.approval_mode || "approve");
        setLanguage(p.language || "en");

        const r = await getAutopilotRuns(10);
        setRuns(r);
        setView("dashboard");
      } else {
        setView("wizard");
      }
    }
    load();
  }, []);

  function togglePlatform(p: PlatformKey) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return name.trim().length >= 2;
      case 1: return niche.trim().length >= 2;
      case 2: return true; // Keywords optional
      case 3: return platforms.length >= 1;
      case 4: return !!frequency;
      case 5: return !!videoType;
      case 6: return !!artStyle;
      case 7: return !!voiceId;
      case 8: return !!durationPref;
      case 9: return !!approvalMode;
      case 10: return true;
      default: return false;
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const result = await saveAutopilotProfile({
      name,
      niche,
      tone: "engaging",
      videoType,
      targetPlatforms: platforms as PlatformKey[],
      postingFrequency: frequency,
      artStyle,
      durationPref,
      approvalMode,
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      language,
      category: niche,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    // Reload profile
    const p = await getAutopilotProfile();
    setProfile(p);
    const r = await getAutopilotRuns(10);
    setRuns(r);
    setView("dashboard");
    setSaving(false);
  }

  async function handleToggle() {
    if (!profile) return;
    setToggling(true);
    await toggleAutopilot(!profile.is_active);
    setProfile({ ...profile, is_active: !profile.is_active });
    setToggling(false);
  }

  if (view === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ========== DASHBOARD VIEW ==========
  if (view === "dashboard" && profile) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Autopilot</h1>
            <p className="text-muted-foreground mt-1">{profile.name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setView("wizard"); setStep(0); }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Edit Settings
            </Button>
            <Button
              variant={profile.is_active ? "destructive" : "default"}
              onClick={handleToggle}
              disabled={toggling}
            >
              {toggling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : profile.is_active ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {profile.is_active ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${profile.is_active ? "bg-green-500" : "bg-yellow-500"}`} />
                {profile.is_active ? "Active" : "Paused"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {profile.posting_frequency} · {(profile.target_platforms || []).length} platforms
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Niche</CardDescription>
              <CardTitle className="capitalize">{profile.niche}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground capitalize">
                {profile.art_style} · {profile.video_type}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Runs</CardDescription>
              <CardTitle>{runs.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {runs.filter((r) => r.status === "completed").length} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connected Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {((profile.target_platforms || []) as string[]).map((p) => {
                const config = PLATFORM_CONFIG[p as PlatformKey];
                return (
                  <Badge key={p} variant="outline" className="capitalize">
                    {config?.name || p}
                    {config?.comingSoon && (
                      <span className="ml-1 text-[10px] text-yellow-500">Soon</span>
                    )}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Runs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No runs yet. Autopilot will start on the next scheduled time.
              </p>
            ) : (
              <div className="space-y-3">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {(run as Record<string, unknown>).ideas
                          ? ((run as Record<string, unknown>).ideas as { title: string })?.title
                          : `Run ${run.run_date}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(run.started_at).toLocaleDateString()} · {run.credits_used} credits
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(run.platforms_posted || []).map((p) => (
                        <Badge key={p} variant="outline" className="text-xs capitalize">
                          {p}
                        </Badge>
                      ))}
                      <Badge
                        variant={
                          run.status === "completed"
                            ? "default"
                            : run.status === "running"
                              ? "outline"
                              : "destructive"
                        }
                        className="capitalize text-xs"
                      >
                        {run.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== WIZARD VIEW ==========
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Set Up Autopilot</h1>
        <p className="text-muted-foreground mt-1">
          Configure your AI video pipeline in {WIZARD_STEPS.length} steps.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1 justify-center">
        {WIZARD_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-6 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Step {step + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[step].label}
      </p>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 0: Name */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Name Your Autopilot</CardTitle>
            <CardDescription>Give it a memorable name.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g. Tech Channel Daily, Fitness Tips Bot"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 1: Niche */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Niche</CardTitle>
            <CardDescription>What type of content will be created?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {NICHES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNiche(n.toLowerCase())}
                  className={`rounded-lg border p-2 text-sm transition-all ${
                    niche === n.toLowerCase()
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <Input
              placeholder="Or type a custom niche..."
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Keywords */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Target Keywords (Optional)</CardTitle>
            <CardDescription>Comma-separated keywords to focus on.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g. AI tools, productivity, side hustle"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Platforms */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Target Platforms</CardTitle>
            <CardDescription>Select where to publish. Connect accounts in Settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.entries(PLATFORM_CONFIG) as [PlatformKey, typeof PLATFORM_CONFIG[PlatformKey]][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePlatform(key)}
                  className={`relative flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-all ${
                    platforms.includes(key)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {config.name}
                  {config.comingSoon && (
                    <Badge className="text-[10px] px-1 py-0 bg-yellow-500/20 text-yellow-500">
                      Soon
                    </Badge>
                  )}
                  {config.warning && (
                    <span className="text-[10px] opacity-60 text-center leading-tight">
                      {config.warning.slice(0, 30)}...
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Frequency */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Posting Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    frequency === f.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Video Type */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Video Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "faceless" as const, label: "Faceless", desc: "AI visuals + voiceover" },
                { value: "avatar" as const, label: "Avatar", desc: "Talking head AI presenter" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setVideoType(t.value)}
                  className={`rounded-lg border p-4 text-center transition-all ${
                    videoType === t.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Art Style */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Art Style</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ART_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setArtStyle(s)}
                  className={`rounded-lg border p-3 text-sm capitalize transition-all ${
                    artStyle === s
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 7: Voice */}
      {step === 7 && (
        <Card>
          <CardHeader>
            <CardTitle>Voice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {FISH_AUDIO_PRESETS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoiceId(v.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    voiceId === v.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{v.name}</span>
                  {voiceId === v.id && <CheckCircle className="ml-auto h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 8: Duration */}
      {step === 8 && (
        <Card>
          <CardHeader>
            <CardTitle>Video Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["30s", "60s", "90s", "3min"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurationPref(d)}
                  className={`rounded-lg border p-3 text-center font-medium transition-all ${
                    durationPref === d
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 9: Approval */}
      {step === 9 && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Mode</CardTitle>
            <CardDescription>
              Choose whether to review content before it&apos;s published.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "approve", label: "Require Approval", desc: "Review via email before publishing" },
                { value: "auto", label: "Fully Automatic", desc: "Publish without review" },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setApprovalMode(m.value)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    approvalMode === m.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 10: Review */}
      {step === 10 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Name", name],
              ["Niche", niche],
              ["Keywords", keywords || "None"],
              ["Platforms", platforms.map((p) => PLATFORM_CONFIG[p]?.name).join(", ")],
              ["Frequency", FREQUENCIES.find((f) => f.value === frequency)?.label || frequency],
              ["Video Type", videoType],
              ["Art Style", artStyle],
              ["Voice", FISH_AUDIO_PRESETS.find((v) => v.id === voiceId)?.name || voiceId],
              ["Duration", durationPref],
              ["Approval", approvalMode === "approve" ? "Require Approval" : "Fully Automatic"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium capitalize">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (step === 0 && profile) {
              setView("dashboard");
            } else {
              setStep(step - 1);
            }
          }}
          disabled={step === 0 && !profile}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {step === 0 && profile ? "Cancel" : "Back"}
        </Button>

        {step < WIZARD_STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {profile ? "Update & Activate" : "Activate Autopilot"}
          </Button>
        )}
      </div>
    </div>
  );
}
