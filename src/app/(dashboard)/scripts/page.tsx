"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Loader2,
  Coins,
  Sparkles,
  Trash2,
  Eye,
  Copy,
  Check,
  Video,
  Mic,
  GraduationCap,
  Clock,
} from "lucide-react";
import {
  generateScript,
  getUserScripts,
  deleteScript,
  type GeneratedScript,
  type ScriptMode,
  type ScriptTone,
} from "@/actions/scripts";
import type { Script } from "@/types";

const TONES: { value: ScriptTone; label: string }[] = [
  { value: "educational", label: "Educational" },
  { value: "entertaining", label: "Entertaining" },
  { value: "inspirational", label: "Inspirational" },
  { value: "promotional", label: "Promotional" },
  { value: "storytelling", label: "Storytelling" },
];

const PLATFORMS = [
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter/X" },
  { value: "linkedin", label: "LinkedIn" },
];

const MODES: { value: ScriptMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "short_form", label: "Short Form", icon: <Clock className="h-4 w-4" />, desc: "15–60s" },
  { value: "long_form", label: "Long Form", icon: <Video className="h-4 w-4" />, desc: "3–10 min" },
  { value: "podcast", label: "Podcast", icon: <Mic className="h-4 w-4" />, desc: "5–15 min" },
  { value: "educational", label: "Educational", icon: <GraduationCap className="h-4 w-4" />, desc: "2–8 min" },
];

export default function ScriptsPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<ScriptTone>("entertaining");
  const [platform, setPlatform] = useState("youtube");
  const [mode, setMode] = useState<ScriptMode>("short_form");
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [savedScripts, setSavedScripts] = useState<Script[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const [viewScript, setViewScript] = useState<Script | null>(null);

  useEffect(() => {
    fetchSavedScripts();
  }, []);

  async function fetchSavedScripts() {
    setLoadingSaved(true);
    const result = await getUserScripts(1, 50);
    setSavedScripts(result.scripts);
    setLoadingSaved(false);
  }

  async function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setError("");
    setGeneratedScript(null);

    const result = await generateScript({
      topic: topic.trim(),
      tone,
      platform,
      mode,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.script) {
      setGeneratedScript(result.script);
      fetchSavedScripts();
    }
    setGenerating(false);
  }

  async function handleDelete(scriptId: string) {
    await deleteScript(scriptId);
    setSavedScripts((prev) => prev.filter((s) => s.id !== scriptId));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function scriptToText(script: GeneratedScript): string {
    return [
      `[HOOK]\n${script.hook}`,
      ...script.body.map(
        (s, i) => `[SCENE ${i + 1} — ${s.timestamp}]\n${s.narration}\nVisual: ${s.visual_direction}`
      ),
      `[CTA]\n${script.cta}`,
    ].join("\n\n");
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Scripts</h1>
        <p className="text-muted-foreground mt-1">
          Generate AI-powered video scripts with hooks, scenes, and CTAs.
        </p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="saved">
            <FileText className="mr-2 h-4 w-4" />
            Saved ({savedScripts.length})
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Script</CardTitle>
              <CardDescription>
                Enter a topic and customize the output format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topic */}
              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Title</Label>
                <Input
                  id="topic"
                  placeholder="e.g. 5 AI tools every creator needs in 2025"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !generating && handleGenerate()}
                />
              </div>

              {/* Mode selector */}
              <div className="space-y-2">
                <Label>Format</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMode(m.value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${
                        mode === m.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {m.icon}
                      <span className="font-medium">{m.label}</span>
                      <span className="text-xs opacity-70">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone + Platform */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => v && setTone(v as ScriptTone)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={(v) => v && setPlatform(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button onClick={handleGenerate} disabled={generating || !topic.trim()} size="lg">
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Script
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  <Coins className="mr-1 h-3 w-3" />2 credits
                </Badge>
              </Button>
            </CardContent>
          </Card>

          {/* Loading */}
          {generating && (
            <Card>
              <CardContent className="py-8 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Separator />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Generated Script */}
          {!generating && generatedScript && (
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Generated Script</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(scriptToText(generatedScript))}
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hook */}
                <div>
                  <Badge className="mb-2 bg-green-500/10 text-green-500">
                    Hook
                  </Badge>
                  <p className="text-sm leading-relaxed font-medium">
                    {generatedScript.hook}
                  </p>
                </div>

                <Separator />

                {/* Body Scenes */}
                <div className="space-y-4">
                  {generatedScript.body.map((scene, i) => (
                    <div key={i} className="rounded-lg border border-border p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Scene {i + 1}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {scene.timestamp}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        {scene.narration}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <Video className="h-3 w-3 mt-0.5 shrink-0" />
                        {scene.visual_direction}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* CTA */}
                <div>
                  <Badge className="mb-2 bg-blue-500/10 text-blue-500">
                    CTA
                  </Badge>
                  <p className="text-sm leading-relaxed font-medium">
                    {generatedScript.cta}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Saved Scripts Tab */}
        <TabsContent value="saved" className="space-y-4 mt-6">
          {loadingSaved ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : savedScripts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No scripts yet. Generate one to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {savedScripts.map((script) => (
                <Card key={script.id}>
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{script.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {script.tone && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {script.tone}
                          </Badge>
                        )}
                        {script.word_count && (
                          <span className="text-xs text-muted-foreground">
                            {script.word_count} words
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(script.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="View script"
                        onClick={() => setViewScript(script)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Copy"
                        onClick={() => copyToClipboard(script.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Delete"
                        onClick={() => handleDelete(script.id)}
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
        </TabsContent>
      </Tabs>

      {/* View Script Dialog */}
      {viewScript && (
        <Dialog open={!!viewScript} onOpenChange={() => setViewScript(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewScript.title}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 mb-4">
              {viewScript.tone && (
                <Badge variant="outline" className="capitalize">
                  {viewScript.tone}
                </Badge>
              )}
              {viewScript.word_count && (
                <Badge variant="outline">{viewScript.word_count} words</Badge>
              )}
              {viewScript.duration_target && (
                <Badge variant="outline">{viewScript.duration_target}s target</Badge>
              )}
            </div>
            <Textarea
              value={viewScript.content}
              readOnly
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(viewScript.content)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
