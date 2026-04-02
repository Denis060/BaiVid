/**
 * TTS provider routing — Google Cloud TTS (primary, free 1M chars/mo)
 * → Fish Audio free tier (secondary) → Fish Audio paid (tertiary).
 */

import {
  generateGoogleTTS,
  isGoogleTTSAvailable,
  type GoogleTTSInput,
} from "./google-tts";
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

/**
 * Maps old Fish Audio preset IDs to Google TTS equivalents.
 */
const VOICE_ID_MAP: Record<string, string> = {
  "default-male-1": "google-en-male-1",
  "default-female-1": "google-en-female-1",
  "default-male-2": "google-en-male-2",
  "default-female-2": "google-en-gb-female",
  "default-narrator": "google-en-gb-male",
};

/**
 * Resolve voice ID — map legacy Fish Audio IDs to Google TTS if needed.
 */
function resolveVoiceId(voiceId: string): string {
  // If it's already a Google voice ID, use it directly
  if (voiceId.startsWith("google-")) {
    return voiceId;
  }

  // Otherwise, map from legacy Fish Audio preset IDs
  return VOICE_ID_MAP[voiceId] || voiceId;
}

export async function routeTTS(input: TTSRouterInput): Promise<TTSRouterResult> {
  // Tier 1: Google Cloud TTS (FREE — 1M chars/mo)
  try {
    const available = await isGoogleTTSAvailable(input.text.length);
    if (available) {
      const resolvedVoiceId = resolveVoiceId(input.voiceId);

      const result = await generateGoogleTTS({
        text: input.text,
        voiceId: resolvedVoiceId,
        speed: input.speed,
      });

      if (input.userId) {
        await logProviderCost({
          userId: input.userId,
          provider: "google-tts-free",
          component: "tts",
          costUsd: PROVIDER_COSTS["google-tts-free"],
          tier: "free",
        });
      }

      return {
        audioUrl: result.audioUrl,
        durationSeconds: result.durationSeconds,
        provider: "google-tts",
        costUsd: PROVIDER_COSTS["google-tts-free"],
      };
    }
  } catch (err) {
    console.error("Google TTS failed, falling back to Fish Audio:", err);
  }

  // Tier 2: Fish Audio free tier
  if (process.env.FISH_AUDIO_API_KEY) {
    const freeAvailable = await isFreeTierAvailable("fish-audio-free").catch(
      () => true
    );
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
