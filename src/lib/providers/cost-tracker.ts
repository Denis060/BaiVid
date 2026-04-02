/**
 * Provider cost tracking — logs actual API costs per call for margin analysis.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface ProviderCostLog {
  userId: string;
  provider: string;
  component: string; // "video" | "tts" | "image" | "script" | "captions"
  costUsd: number;
  tier: "free" | "cheap" | "premium";
  referenceId?: string;
}

// Estimated costs per provider per call
export const PROVIDER_COSTS: Record<string, number> = {
  // Video
  "kling-free": 0,
  "kling-paid": 0.08,
  haiper: 0.05,
  pika: 0.04,
  "wan-siliconflow": 0.01,
  pexels: 0,
  pixabay: 0,
  // TTS
  "fish-audio-free": 0,
  "fish-audio-paid": 0.01,
  "qwen3-tts": 0.005,
  // Images
  "flux-hf": 0,
  "flux-replicate": 0.02,
  ideogram: 0.05,
  // Scripts
  "gemini-flash": 0,
  grok: 0.005,
  "gpt-4o": 0.02,
  // Captions
  whisper: 0,
  assemblyai: 0.01,
  // D-ID
  "d-id": 0.10,
};

/**
 * Log a provider cost to the database.
 */
export async function logProviderCost(log: ProviderCostLog): Promise<void> {
  try {
    const supabase = getServiceClient();

    // Store in credits_transactions metadata for now
    // In production, use a dedicated provider_costs table
    await supabase.from("credits_transactions").insert({
      user_id: log.userId,
      amount: 0, // No credit impact — this is for cost tracking only
      type: "usage" as const,
      description: `[COST] ${log.component}:${log.provider} $${log.costUsd.toFixed(4)} (${log.tier})`,
      reference_id: log.referenceId || null,
      balance_after: 0, // Will be updated by the actual deduction
    });
  } catch (err) {
    console.error("Failed to log provider cost:", err);
  }
}

/**
 * Track daily free credit usage per provider.
 * Uses Supabase to store counters (reset daily).
 */
export async function getFreeTierUsage(
  provider: string
): Promise<number> {
  const supabase = getServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { count } = await supabase
    .from("credits_transactions")
    .select("id", { count: "exact", head: true })
    .ilike("description", `%[COST] %:${provider}%`)
    .gte("created_at", `${today}T00:00:00`);

  return count || 0;
}

// Daily free limits per provider
export const FREE_DAILY_LIMITS: Record<string, number> = {
  "kling-free": 10,
  "fish-audio-free": 50,
  "flux-hf": 20,
  "gemini-flash": 100,
  whisper: 50,
  pexels: 200,
  pixabay: 200,
};

/**
 * Check if a provider's free tier is still available today.
 */
export async function isFreeTierAvailable(provider: string): Promise<boolean> {
  const limit = FREE_DAILY_LIMITS[provider];
  if (!limit) return false;

  const usage = await getFreeTierUsage(provider);
  return usage < limit;
}
