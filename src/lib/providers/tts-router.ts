/**
 * TTS provider routing — Fish Audio (free) → Qwen3-TTS → premium fallbacks.
 */

import { generateFishAudioTTS, type FishAudioInput } from "./fish-audio";
import { logProviderCost, isFreeTierAvailable, PROVIDER_COSTS } from "./cost-tracker";

export interface TTSRouterInput {
  text: string;
  voiceId: string;
  speed?: number;
  userId?: string;
  userPlan?: string;
}

export interface TTSRouterResult {
  audioUrl: string;
  durationSeconds: number;
  provider: string;
  costUsd: number;
}

export async function routeTTS(input: TTSRouterInput): Promise<TTSRouterResult> {
  // Tier 1: Fish Audio free tier
  if (process.env.FISH_AUDIO_API_KEY) {
    const freeAvailable = await isFreeTierAvailable("fish-audio-free").catch(() => true);
    const tier = freeAvailable ? "free" : "cheap";
    const costKey = freeAvailable ? "fish-audio-free" : "fish-audio-paid";

    try {
      const result = await generateFishAudioTTS({
        text: input.text,
        voiceId: input.voiceId,
        speed: input.speed,
      });

      if (input.userId) {
        await logProviderCost({
          userId: input.userId,
          provider: costKey,
          component: "tts",
          costUsd: PROVIDER_COSTS[costKey],
          tier: tier as "free" | "cheap",
        });
      }

      return {
        audioUrl: result.audioUrl,
        durationSeconds: result.durationSeconds,
        provider: "fish-audio",
        costUsd: PROVIDER_COSTS[costKey],
      };
    } catch (err) {
      console.error("Fish Audio TTS failed:", err);
    }
  }

  throw new Error("No TTS provider available");
}
