/**
 * Script/Ideas AI routing — Gemini Flash (free) → Grok → GPT-4o (premium).
 */

import { getGeminiFlash } from "@/lib/gemini";
import { logProviderCost, isFreeTierAvailable, PROVIDER_COSTS } from "./cost-tracker";

export interface ScriptRouterInput {
  prompt: string;
  userId?: string;
  userPlan?: string;
}

export interface ScriptRouterResult {
  text: string;
  provider: string;
  costUsd: number;
}

export async function routeScriptGeneration(
  input: ScriptRouterInput
): Promise<ScriptRouterResult> {
  // Tier 1: Gemini 1.5 Flash (free)
  if (process.env.GEMINI_API_KEY) {
    const freeAvailable = await isFreeTierAvailable("gemini-flash").catch(() => true);
    if (freeAvailable) {
      try {
        const model = getGeminiFlash();
        const result = await model.generateContent(input.prompt);
        const text = result.response.text();

        if (input.userId) {
          await logProviderCost({
            userId: input.userId,
            provider: "gemini-flash",
            component: "script",
            costUsd: 0,
            tier: "free",
          });
        }

        return { text, provider: "gemini-flash", costUsd: 0 };
      } catch (err) {
        console.error("Gemini Flash failed:", err);
      }
    }
  }

  // Tier 2: Grok API
  if (process.env.GROK_API_KEY) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-3-mini",
          messages: [{ role: "user", content: input.prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";

        if (input.userId) {
          await logProviderCost({
            userId: input.userId,
            provider: "grok",
            component: "script",
            costUsd: PROVIDER_COSTS.grok,
            tier: "cheap",
          });
        }

        return { text, provider: "grok", costUsd: PROVIDER_COSTS.grok };
      }
    } catch (err) {
      console.error("Grok failed:", err);
    }
  }

  // Tier 3: GPT-4o (premium, Pro/Agency only)
  if (
    process.env.OPENAI_API_KEY &&
    (input.userPlan === "pro" || input.userPlan === "agency")
  ) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: input.prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";

        if (input.userId) {
          await logProviderCost({
            userId: input.userId,
            provider: "gpt-4o",
            component: "script",
            costUsd: PROVIDER_COSTS["gpt-4o"],
            tier: "premium",
          });
        }

        return { text, provider: "gpt-4o", costUsd: PROVIDER_COSTS["gpt-4o"] };
      }
    } catch (err) {
      console.error("GPT-4o failed:", err);
    }
  }

  throw new Error("No script generation provider available");
}
