"use client";

import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lightbulb,
  Loader2,
  TrendingUp,
  Coins,
  Sparkles,
  Trash2,
  FileText,
  Archive,
} from "lucide-react";
import {
  generateIdeas,
  getUserIdeas,
  deleteIdea,
  updateIdeaStatus,
  type GeneratedIdea,
} from "@/actions/ideas";
import type { Idea } from "@/types";

const PLATFORMS = [
  { value: "any", label: "Any Platform" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter/X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
];

const REGIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "IN", label: "India" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "BR", label: "Brazil" },
];

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-green-500/10 text-green-500";
  if (score >= 60) return "bg-yellow-500/10 text-yellow-500";
  if (score >= 40) return "bg-orange-500/10 text-orange-500";
  return "bg-red-500/10 text-red-500";
}

export default function IdeasPage() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("any");
  const [region, setRegion] = useState("US");
  const [generating, setGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [error, setError] = useState("");

  const [savedIdeas, setSavedIdeas] = useState<Idea[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  useEffect(() => {
    fetchSavedIdeas();
  }, []);

  async function fetchSavedIdeas() {
    setLoadingSaved(true);
    const result = await getUserIdeas(1, 50);
    setSavedIdeas(result.ideas);
    setLoadingSaved(false);
  }

  async function handleGenerate() {
    if (!niche.trim()) return;
    setGenerating(true);
    setError("");
    setGeneratedIdeas([]);

    const result = await generateIdeas({
      niche: niche.trim(),
      platform: platform === "any" ? undefined : platform,
      region,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.ideas) {
      setGeneratedIdeas(result.ideas);
      // Refresh saved ideas since new ones were saved
      fetchSavedIdeas();
    }
    setGenerating(false);
  }

  async function handleDelete(ideaId: string) {
    await deleteIdea(ideaId);
    setSavedIdeas((prev) => prev.filter((i) => i.id !== ideaId));
  }

  async function handleStatusChange(
    ideaId: string,
    status: "new" | "scripted" | "produced" | "archived"
  ) {
    await updateIdeaStatus(ideaId, status);
    setSavedIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, status } : i))
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Ideas</h1>
        <p className="text-muted-foreground mt-1">
          Discover trending video ideas powered by AI and real search data.
        </p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Lightbulb className="mr-2 h-4 w-4" />
            Saved ({savedIdeas.length})
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Trending Ideas</CardTitle>
              <CardDescription>
                Enter your niche and we&apos;ll find 10 trending video ideas
                with virality scores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="niche">Niche / Topic</Label>
                  <Input
                    id="niche"
                    placeholder="e.g. AI tools, fitness, personal finance, cooking"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !generating && handleGenerate()
                    }
                  />
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
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select value={region} onValueChange={(v) => v && setRegion(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
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

              <Button
                onClick={handleGenerate}
                disabled={generating || !niche.trim()}
                size="lg"
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Ideas
                <Badge
                  variant="outline"
                  className="ml-2 text-xs font-normal"
                >
                  <Coins className="mr-1 h-3 w-3" />5 credits
                </Badge>
              </Button>
            </CardContent>
          </Card>

          {/* Loading Skeletons */}
          {generating && (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Generated Results */}
          {!generating && generatedIdeas.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Results for &ldquo;{niche}&rdquo;
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {generatedIdeas.map((idea, i) => (
                  <Card key={i} className="relative overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <div
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${getScoreBg(idea.virality_score)}`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {idea.virality_score}
                      </div>
                    </div>
                    <CardHeader className="pb-2 pr-20">
                      <CardTitle className="text-base leading-snug">
                        {idea.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground italic">
                        &ldquo;{idea.hook_suggestion}&rdquo;
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {idea.best_platform}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {idea.search_volume} searches
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {idea.estimated_reach} views
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {idea.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Saved Ideas Tab */}
        <TabsContent value="saved" className="space-y-4 mt-6">
          {loadingSaved ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : savedIdeas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No saved ideas yet. Generate some ideas to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {savedIdeas.map((idea) => (
                <Card key={idea.id}>
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{idea.title}</h3>
                        <Badge
                          variant="outline"
                          className="text-xs capitalize shrink-0"
                        >
                          {idea.status}
                        </Badge>
                        {idea.category && (
                          <Badge
                            variant="outline"
                            className="text-xs capitalize shrink-0"
                          >
                            {idea.category}
                          </Badge>
                        )}
                      </div>
                      {idea.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {idea.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(idea.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {idea.status === "new" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Mark as scripted"
                          onClick={() =>
                            handleStatusChange(idea.id, "scripted")
                          }
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Archive"
                        onClick={() =>
                          handleStatusChange(idea.id, "archived")
                        }
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Delete"
                        onClick={() => handleDelete(idea.id)}
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
    </div>
  );
}
