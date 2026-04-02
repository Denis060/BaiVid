"use server";

import { createClient } from "@/lib/supabase/server";
import { getGeminiFlash } from "@/lib/gemini";

export interface AIInsight {
  summary: string;
  topPerformingPattern: string;
  nextTopicSuggestion: string;
  bestPostingTime: string;
  improvementTip: string;
}

export async function getAIInsights(): Promise<AIInsight | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get recent analytics and video data
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [analyticsRes, videosRes] = await Promise.all([
    supabase
      .from("analytics_snapshots")
      .select("platform, views, likes, comments, snapshot_date")
      .eq("user_id", user.id)
      .gte("snapshot_date", thirtyDaysAgo)
      .order("views", { ascending: false })
      .limit(20),
    supabase
      .from("videos")
      .select("title, type, art_style, duration, credits_used")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const analytics = analyticsRes.data || [];
  const videos = videosRes.data || [];

  if (analytics.length === 0 && videos.length === 0) return null;

  const analyticsContext = analytics
    .map((a) => `${a.platform}: ${a.views} views, ${a.likes} likes on ${a.snapshot_date}`)
    .join("\n");

  const videosContext = videos
    .map((v) => `"${v.title}" (${v.type}, ${v.art_style}, ${v.duration}s)`)
    .join("\n");

  try {
    const model = getGeminiFlash();
    const result = await model.generateContent(
      `You are an AI video content strategist. Analyze this creator's recent performance and give actionable insights.

Recent analytics:
${analyticsContext || "No analytics data yet"}

Recent videos:
${videosContext || "No videos yet"}

Return ONLY a JSON object:
{
  "summary": "One sentence summary of overall performance",
  "topPerformingPattern": "What type of content is performing best and why",
  "nextTopicSuggestion": "Specific topic suggestion for their next video",
  "bestPostingTime": "Suggested best day/time to post based on engagement patterns",
  "improvementTip": "One actionable tip to improve performance"
}`
    );

    const text = result.response.text().replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(text) as AIInsight;
  } catch (err) {
    console.error("AI insights generation failed:", err);
    return null;
  }
}
