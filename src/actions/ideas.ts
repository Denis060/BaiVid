"use server";

import { createClient } from "@/lib/supabase/server";
import { getGeminiFlash } from "@/lib/gemini";
import { getTrendingData } from "@/lib/trends";
import { deductCredits } from "./credits";

const IDEA_COST = 5;

export interface GeneratedIdea {
  title: string;
  virality_score: number;
  search_volume: string;
  best_platform: string;
  estimated_reach: string;
  hook_suggestion: string;
  category: string;
}

export interface GenerateIdeasInput {
  niche: string;
  platform?: string;
  region?: string;
  language?: string;
}

export interface GenerateIdeasResult {
  ideas?: GeneratedIdea[];
  savedCount?: number;
  error?: string;
}

export async function generateIdeas(
  input: GenerateIdeasInput
): Promise<GenerateIdeasResult> {
  const { niche, platform, region = "US", language = "en" } = input;

  if (!niche || niche.trim().length < 2) {
    return { error: "Please enter a niche (at least 2 characters)" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check credits
  const { data: profile } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_balance < IDEA_COST) {
    return {
      error: `Insufficient credits. You need ${IDEA_COST} but have ${profile?.credits_balance || 0}.`,
    };
  }

  // Fetch trending data
  const trendData = await getTrendingData(niche, region, 10);
  const trendContext = trendData
    .map((t) => `- "${t.keyword}" (${t.searchVolume}, ${t.trendDirection})`)
    .join("\n");

  // Build Gemini prompt
  const platformFilter = platform
    ? `Optimize ideas specifically for ${platform}.`
    : "Suggest the best platform for each idea.";
  const languageNote =
    language !== "en" ? `Generate ideas in ${language}.` : "";

  const prompt = `You are a viral video content strategist. Generate exactly 10 trending video ideas for the niche "${niche}" in region "${region}".

${platformFilter}
${languageNote}

Here are current trending signals for context:
${trendContext}

Return a JSON array of exactly 10 objects. Each object must have:
- "title": string — catchy, specific video title (not generic)
- "virality_score": number — estimated virality 1-100 based on trend data and engagement potential
- "search_volume": string — estimated monthly search volume (e.g. "50K", "120K", "1.2M")
- "best_platform": string — one of: "youtube", "tiktok", "instagram", "twitter", "linkedin", "facebook"
- "estimated_reach": string — estimated view potential (e.g. "10K-50K", "100K-500K", "1M+")
- "hook_suggestion": string — a compelling first line or hook for the video
- "category": string — content category (e.g. "tech", "finance", "lifestyle", "education")

Sort by virality_score descending. Return ONLY the JSON array, no markdown, no explanation.`;

  try {
    const model = getGeminiFlash();
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const ideas: GeneratedIdea[] = JSON.parse(jsonStr);

    if (!Array.isArray(ideas) || ideas.length === 0) {
      return { error: "Failed to generate ideas. Please try again." };
    }

    // Deduct credits
    const deductResult = await deductCredits(
      user.id,
      IDEA_COST,
      `Idea generation: "${niche}"`,
    );

    if (!deductResult.success) {
      return { error: deductResult.error || "Failed to deduct credits" };
    }

    // Save ideas to database
    const ideaRows = ideas.slice(0, 10).map((idea) => ({
      user_id: user.id,
      title: idea.title,
      description: `Hook: ${idea.hook_suggestion}\nReach: ${idea.estimated_reach}\nSearch Volume: ${idea.search_volume}`,
      category: idea.category,
      status: "new" as const,
      source: `gemini:${niche}`,
    }));

    const { data: saved } = await supabase
      .from("ideas")
      .insert(ideaRows)
      .select("id");

    return {
      ideas: ideas.slice(0, 10),
      savedCount: saved?.length || 0,
    };
  } catch (err) {
    console.error("Gemini idea generation failed:", err);
    return {
      error: "Failed to generate ideas. Please check your API key and try again.",
    };
  }
}

/**
 * Fetch user's saved ideas with pagination.
 */
export async function getUserIdeas(page: number = 1, limit: number = 20) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ideas: [], count: 0 };

  const offset = (page - 1) * limit;

  const { data, count } = await supabase
    .from("ideas")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { ideas: data || [], count: count || 0 };
}

/**
 * Delete an idea.
 */
export async function deleteIdea(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("ideas")
    .delete()
    .eq("id", ideaId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Update idea status.
 */
export async function updateIdeaStatus(
  ideaId: string,
  status: "new" | "scripted" | "produced" | "archived"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("ideas")
    .update({ status })
    .eq("id", ideaId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
