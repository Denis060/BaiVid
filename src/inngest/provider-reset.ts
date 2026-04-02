import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";

function getRawClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Daily reset of provider free credit counters.
 * Runs at midnight UTC.
 */
export const providerFreeCreditsReset = inngest.createFunction(
  {
    id: "provider-free-credits-reset",
    triggers: [{ cron: "0 0 * * *" }],
  },
  async ({ step }) => {
    await step.run("reset-credits", async () => {
      const supabase = getRawClient();
      const today = new Date().toISOString().split("T")[0];

      // Get all active providers with daily free credits
      const { data: providers } = await supabase
        .from("providers")
        .select("name, daily_free_credits")
        .eq("is_active", true)
        .gt("daily_free_credits", 0);

      if (!providers || providers.length === 0) return { providersReset: 0 };

      // Upsert today's free credit records
      for (const p of providers) {
        await supabase
          .from("provider_free_credits")
          .upsert(
            {
              provider_name: p.name,
              date: today,
              credits_available: p.daily_free_credits,
              credits_used: 0,
              reset_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "provider_name,date" }
          );
      }

      return { providersReset: providers.length };
    });
  }
);
