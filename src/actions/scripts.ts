"use server";

import { createClient } from "@/lib/supabase/server";
import { getGeminiFlash } from "@/lib/gemini";
import { deductCredits } from "./credits";

const SCRIPT_COST = 2;

export interface ScriptScene {
  timestamp: string;
  narration: string;
  visual_direction: string;
}

export interface GeneratedScript {
  hook: string;
  body: ScriptScene[];
  cta: string;
}

export type ScriptMode = "short_form" | "long_form" | "podcast" | "educational";
export type ScriptTone =
  | "educational"
  | "entertaining"
  | "inspirational"
  | "promotional"
  | "storytelling";

export interface GenerateScriptInput {
  topic: string;
  tone: ScriptTone;
  platform: string;
  mode: ScriptMode;
  ideaId?: string;
}

export interface GenerateScriptResult {
  script?: GeneratedScript;
  scriptId?: string;
  error?: string;
}

const MODE_CONFIG: Record<ScriptMode, { label: string; duration: string; sceneCount: string }> = {
  short_form: { label: "Short Form", duration: "15–60 seconds", sceneCount: "3-5" },
  long_form: { label: "Long Form", duration: "3–10 minutes", sceneCount: "8-15" },
  podcast: { label: "Podcast", duration: "5–15 minutes", sceneCount: "6-12" },
  educational: { label: "Educational", duration: "2–8 minutes", sceneCount: "6-10" },
};

export async function generateScript(
  input: GenerateScriptInput
): Promise<GenerateScriptResult> {
  const { topic, tone, platform, mode, ideaId } = input;

  if (!topic || topic.trim().length < 3) {
    return { error: "Topic must be at least 3 characters" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Check credits
  const { data: profile } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_balance < SCRIPT_COST) {
    return {
      error: `Insufficient credits. You need ${SCRIPT_COST} but have ${profile?.credits_balance || 0}.`,
    };
  }

  const config = MODE_CONFIG[mode];

  const prompt = `You are an expert video scriptwriter. Write a compelling ${config.label} video script about "${topic}" for ${platform}.

Requirements:
- Tone: ${tone}
- Duration: ${config.duration}
- Structure: Hook → Body (${config.sceneCount} scenes) → CTA
- The hook must grab attention in the first 3 seconds
- Each scene needs narration text AND visual direction for the editor
- The CTA should drive engagement (subscribe, like, comment, follow)
${platform === "tiktok" || platform === "instagram" ? "- Keep language punchy, fast-paced, and casual" : ""}
${platform === "youtube" ? "- Include a pattern interrupt mid-way to retain viewers" : ""}
${mode === "podcast" ? "- Focus on conversational narration, minimal visual directions" : ""}
${mode === "educational" ? "- Use clear explanations, examples, and step-by-step structure" : ""}

Return ONLY a JSON object with this structure (no markdown, no explanation):
{
  "hook": "The opening hook text (first 3-5 seconds)",
  "body": [
    {
      "timestamp": "0:05-0:15",
      "narration": "What the narrator says",
      "visual_direction": "What should appear on screen"
    }
  ],
  "cta": "The closing call-to-action text"
}`;

  try {
    const model = getGeminiFlash();
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonStr = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const script: GeneratedScript = JSON.parse(jsonStr);

    if (!script.hook || !Array.isArray(script.body) || !script.cta) {
      return { error: "Invalid script format. Please try again." };
    }

    // Deduct credits
    const deductResult = await deductCredits(
      user.id,
      SCRIPT_COST,
      `Script generation: "${topic}"`,
    );

    if (!deductResult.success) {
      return { error: deductResult.error || "Failed to deduct credits" };
    }

    // Build full script content for storage
    const fullContent = [
      `[HOOK]\n${script.hook}`,
      ...script.body.map(
        (s, i) =>
          `[SCENE ${i + 1} — ${s.timestamp}]\n${s.narration}\n📹 ${s.visual_direction}`
      ),
      `[CTA]\n${script.cta}`,
    ].join("\n\n");

    const wordCount = fullContent.split(/\s+/).length;
    const durationTarget =
      mode === "short_form"
        ? 30
        : mode === "long_form"
          ? 300
          : mode === "podcast"
            ? 600
            : 240;

    // Save to database
    const { data: saved } = await supabase
      .from("scripts")
      .insert({
        user_id: user.id,
        idea_id: ideaId || null,
        title: topic,
        content: fullContent,
        tone,
        duration_target: durationTarget,
        word_count: wordCount,
      })
      .select("id")
      .single();

    // Update idea status if linked
    if (ideaId) {
      await supabase
        .from("ideas")
        .update({ status: "scripted" })
        .eq("id", ideaId)
        .eq("user_id", user.id);
    }

    return {
      script,
      scriptId: saved?.id,
    };
  } catch (err) {
    console.error("Script generation failed:", err);
    return { error: "Failed to generate script. Please try again." };
  }
}

/**
 * Fetch user's saved scripts.
 */
export async function getUserScripts(page: number = 1, limit: number = 20) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { scripts: [], count: 0 };

  const offset = (page - 1) * limit;

  const { data, count } = await supabase
    .from("scripts")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { scripts: data || [], count: count || 0 };
}

/**
 * Get a single script by ID.
 */
export async function getScript(scriptId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .eq("user_id", user.id)
    .single();

  return data;
}

/**
 * Update a script's content.
 */
export async function updateScript(scriptId: string, content: string, title?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const wordCount = content.split(/\s+/).length;
  const updates: Record<string, unknown> = { content, word_count: wordCount };
  if (title) updates.title = title;

  const { error } = await supabase
    .from("scripts")
    .update(updates)
    .eq("id", scriptId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Delete a script.
 */
export async function deleteScript(scriptId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("scripts")
    .delete()
    .eq("id", scriptId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
