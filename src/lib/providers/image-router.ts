/**
 * Image generation routing — Flux.2 HF (free) → Replicate → Ideogram (premium).
 */

import { generateFluxImage } from "./flux";
import { generateIdeogramImage } from "./ideogram";
import { logProviderCost, isFreeTierAvailable, PROVIDER_COSTS } from "./cost-tracker";

export interface ImageRouterInput {
  prompt: string;
  width?: number;
  height?: number;
  userId?: string;
  userPlan?: string;
}

export interface ImageRouterResult {
  imageBuffer: Buffer;
  provider: string;
  costUsd: number;
}

export async function routeImageGeneration(
  input: ImageRouterInput
): Promise<ImageRouterResult> {
  const width = input.width || 1280;
  const height = input.height || 720;

  // Tier 1: Flux.2 via HuggingFace (free)
  if (process.env.HUGGINGFACE_API_KEY) {
    const freeAvailable = await isFreeTierAvailable("flux-hf").catch(() => true);
    if (freeAvailable) {
      try {
        const buffer = await generateFluxImage(input.prompt, width, height);

        if (input.userId) {
          await logProviderCost({
            userId: input.userId,
            provider: "flux-hf",
            component: "image",
            costUsd: 0,
            tier: "free",
          });
        }

        return { imageBuffer: buffer, provider: "flux", costUsd: 0 };
      } catch (err) {
        console.error("Flux.2 failed:", err);
      }
    }
  }

  // Tier 2/3: Ideogram via Replicate
  if (process.env.REPLICATE_API_KEY) {
    try {
      const buffer = await generateIdeogramImage(input.prompt, width, height);
      const costUsd = PROVIDER_COSTS.ideogram;

      if (input.userId) {
        await logProviderCost({
          userId: input.userId,
          provider: "ideogram",
          component: "image",
          costUsd,
          tier: "premium",
        });
      }

      return { imageBuffer: buffer, provider: "ideogram", costUsd };
    } catch (err) {
      console.error("Ideogram failed:", err);
    }
  }

  throw new Error("No image generation provider available");
}
