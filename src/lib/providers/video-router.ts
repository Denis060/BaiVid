/**
 * Multi-provider video routing — tries providers by cost tier.
 * Free credits first → cheap paid → premium → stock footage fallback.
 */

import { generateKlingVideo, type KlingGenerateResult } from "./kling";
import { generateHaiperVideo } from "./haiper";
import { generatePikaVideo } from "./pika";
import { searchStockFootage, type StockClip } from "./stock-footage";

export interface VideoRouterInput {
  prompt: string;
  duration: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  style?: string;
}

export interface VideoRouterResult {
  videoUrl: string;
  provider: "kling" | "haiper" | "pika" | "pexels" | "pixabay";
  fallbackUsed: boolean;
}

/**
 * Route video generation through providers by cost/availability.
 * Order: Kling 3.0 → Haiper → Pika 2.5 → Stock footage
 */
export async function routeVideoGeneration(
  input: VideoRouterInput
): Promise<VideoRouterResult> {
  const errors: string[] = [];

  // Tier 1: Kling AI 3.0 (premium)
  if (process.env.KLING_API_KEY) {
    try {
      const result: KlingGenerateResult = await generateKlingVideo({
        prompt: input.prompt,
        duration: input.duration,
        aspectRatio: input.aspectRatio,
        style: input.style,
      });
      return {
        videoUrl: result.videoUrl,
        provider: "kling",
        fallbackUsed: false,
      };
    } catch (err) {
      errors.push(`Kling: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  // Tier 2: Haiper (mid-tier)
  if (process.env.HAIPER_API_KEY) {
    try {
      const result = await generateHaiperVideo({
        prompt: input.prompt,
        duration: input.duration,
        aspectRatio: input.aspectRatio,
      });
      return {
        videoUrl: result.videoUrl,
        provider: "haiper",
        fallbackUsed: true,
      };
    } catch (err) {
      errors.push(`Haiper: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  // Tier 3: Pika 2.5 (budget)
  if (process.env.PIKA_API_KEY) {
    try {
      const result = await generatePikaVideo({
        prompt: input.prompt,
        duration: input.duration,
        aspectRatio: input.aspectRatio,
      });
      return {
        videoUrl: result.videoUrl,
        provider: "pika",
        fallbackUsed: true,
      };
    } catch (err) {
      errors.push(`Pika: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  // Tier 4: Stock footage fallback (Pexels + Pixabay)
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
    return {
      videoUrl: clips[0].url,
      provider: clips[0].provider,
      fallbackUsed: true,
    };
  }

  throw new Error(
    `All video providers failed: ${errors.join("; ")}. No stock footage found.`
  );
}
