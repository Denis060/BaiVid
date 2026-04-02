/**
 * Multi-provider video routing engine — selects the cheapest available provider
 * based on user plan, free credit availability, and automatic fallback.
 *
 * Tier 1 (Free): Kling AI daily free credits, Wan 2.2 via SiliconFlow
 * Tier 2 (Cheap): Haiper, Pika 2.5
 * Tier 3 (Premium): Kling AI 3.0 paid (Agency plan only)
 * Fallback: Pexels + Pixabay stock footage
 */

import { generateKlingVideo } from "./kling";
import { generateHaiperVideo } from "./haiper";
import { generatePikaVideo } from "./pika";
import { searchStockFootage, type StockClip } from "./stock-footage";
import {
  logProviderCost,
  isFreeTierAvailable,
  PROVIDER_COSTS,
} from "./cost-tracker";

export interface VideoRouterInput {
  prompt: string;
  duration: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  style?: string;
  userId?: string;
  userPlan?: string;
}

export interface VideoRouterResult {
  videoUrl: string;
  provider: string;
  tier: "free" | "cheap" | "premium" | "stock";
  costUsd: number;
  fallbackUsed: boolean;
}

/**
 * Route video generation through providers by plan and cost tier.
 */
export async function routeVideoGeneration(
  input: VideoRouterInput
): Promise<VideoRouterResult> {
  const errors: string[] = [];
  const plan = input.userPlan || "free";

  // ========================================
  // Tier 1: Free providers
  // ========================================

  // Kling AI free daily credits
  if (process.env.KLING_API_KEY) {
    const freeAvailable = await isFreeTierAvailable("kling-free").catch(() => true);
    if (freeAvailable) {
      try {
        const result = await generateKlingVideo({
          prompt: input.prompt,
          duration: input.duration,
          aspectRatio: input.aspectRatio,
          style: input.style,
        });

        const costUsd = PROVIDER_COSTS["kling-free"];
        if (input.userId) {
          await logProviderCost({
            userId: input.userId,
            provider: "kling-free",
            component: "video",
            costUsd,
            tier: "free",
          });
        }

        return {
          videoUrl: result.videoUrl,
          provider: "kling",
          tier: "free",
          costUsd,
          fallbackUsed: false,
        };
      } catch (err) {
        errors.push(`Kling(free): ${err instanceof Error ? err.message : "failed"}`);
      }
    }
  }

  // ========================================
  // Tier 2: Cheap paid providers
  // ========================================

  // Haiper
  if (process.env.HAIPER_API_KEY) {
    try {
      const result = await generateHaiperVideo({
        prompt: input.prompt,
        duration: input.duration,
        aspectRatio: input.aspectRatio,
      });

      const costUsd = PROVIDER_COSTS.haiper;
      if (input.userId) {
        await logProviderCost({
          userId: input.userId,
          provider: "haiper",
          component: "video",
          costUsd,
          tier: "cheap",
        });
      }

      return {
        videoUrl: result.videoUrl,
        provider: "haiper",
        tier: "cheap",
        costUsd,
        fallbackUsed: true,
      };
    } catch (err) {
      errors.push(`Haiper: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  // Pika 2.5
  if (process.env.PIKA_API_KEY) {
    try {
      const result = await generatePikaVideo({
        prompt: input.prompt,
        duration: input.duration,
        aspectRatio: input.aspectRatio,
      });

      const costUsd = PROVIDER_COSTS.pika;
      if (input.userId) {
        await logProviderCost({
          userId: input.userId,
          provider: "pika",
          component: "video",
          costUsd,
          tier: "cheap",
        });
      }

      return {
        videoUrl: result.videoUrl,
        provider: "pika",
        tier: "cheap",
        costUsd,
        fallbackUsed: true,
      };
    } catch (err) {
      errors.push(`Pika: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  // ========================================
  // Tier 3: Premium (Agency/Pro only)
  // ========================================
  if ((plan === "agency" || plan === "pro") && process.env.KLING_API_KEY) {
    try {
      const result = await generateKlingVideo({
        prompt: input.prompt,
        duration: input.duration,
        aspectRatio: input.aspectRatio,
        style: input.style,
      });

      const costUsd = PROVIDER_COSTS["kling-paid"];
      if (input.userId) {
        await logProviderCost({
          userId: input.userId,
          provider: "kling-paid",
          component: "video",
          costUsd,
          tier: "premium",
        });
      }

      return {
        videoUrl: result.videoUrl,
        provider: "kling",
        tier: "premium",
        costUsd,
        fallbackUsed: true,
      };
    } catch (err) {
      errors.push(`Kling(premium): ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  // ========================================
  // Fallback: Stock footage
  // ========================================
  const orientation =
    input.aspectRatio === "9:16"
      ? "portrait"
      : input.aspectRatio === "1:1"
        ? "square"
        : "landscape";

  const clips: StockClip[] = await searchStockFootage(
    input.prompt,
    3,
    orientation as "landscape" | "portrait" | "square"
  );

  if (clips.length > 0) {
    if (input.userId) {
      await logProviderCost({
        userId: input.userId,
        provider: clips[0].provider,
        component: "video",
        costUsd: 0,
        tier: "free",
      });
    }

    return {
      videoUrl: clips[0].url,
      provider: clips[0].provider,
      tier: "stock",
      costUsd: 0,
      fallbackUsed: true,
    };
  }

  throw new Error(
    `All video providers failed: ${errors.join("; ")}. No stock footage found.`
  );
}
