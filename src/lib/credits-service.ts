/**
 * Service-role credit deduction — for use in Inngest functions (no cookie context).
 * Includes low-credit warning email trigger.
 */

import { createClient } from "@supabase/supabase-js";
import { sendCreditsLowEmail } from "./email";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const PLAN_CREDITS: Record<string, number> = {
  free: 50,
  starter: 500,
  pro: 1500,
  agency: 5000,
};

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

/**
 * Deduct credits using service role (for Inngest background jobs).
 * Checks balance, deducts, logs transaction, triggers low-credit warning.
 */
export async function deductCreditsService(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const supabase = getServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("credits_balance, plan, email")
    .eq("id", userId)
    .single();

  if (!user) return { success: false, error: "User not found" };

  const newBalance = Math.max(0, user.credits_balance - amount);

  await supabase
    .from("users")
    .update({ credits_balance: newBalance })
    .eq("id", userId);

  await supabase.from("credits_transactions").insert({
    user_id: userId,
    amount: -amount,
    type: "usage",
    description,
    reference_id: referenceId || null,
    balance_after: newBalance,
  });

  // Check low-credit warning (20% threshold)
  const planCredits = PLAN_CREDITS[user.plan] || 50;
  const threshold = Math.floor(planCredits * 0.2);

  if (newBalance <= threshold && user.credits_balance > threshold) {
    try {
      await sendCreditsLowEmail(
        user.email,
        newBalance,
        planCredits,
        PLAN_NAMES[user.plan] || "Free",
        userId
      );
    } catch (err) {
      console.error("Failed to send low credit warning:", err);
    }
  }

  return { success: true, newBalance };
}
