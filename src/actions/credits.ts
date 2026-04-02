"use server";

import { createClient } from "@/lib/supabase/server";
import { sendCreditsLowEmail } from "@/lib/email";
import { getStripe, TOPUP_PACKS } from "@/lib/stripe";

export type DeductResult = {
  success: boolean;
  error?: string;
  newBalance?: number;
};

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

/**
 * Deduct credits from a user's balance.
 * Checks balance, deducts, logs transaction, triggers low-credit warning at 20%,
 * and auto-topup if enabled.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string
): Promise<DeductResult> {
  const supabase = await createClient();

  // Get current balance, plan, and auto-topup settings
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("credits_balance, plan, email, stripe_customer_id")
    .eq("id", userId)
    .single();

  if (fetchError || !user) {
    return { success: false, error: "User not found" };
  }

  if (user.credits_balance < amount) {
    // Check if auto-topup can cover the deficit
    const autoTopupResult = await tryAutoTopup(userId, user, amount);
    if (!autoTopupResult.success) {
      return {
        success: false,
        error: `Insufficient credits. You need ${amount} but have ${user.credits_balance}.`,
      };
    }
    // Re-fetch balance after auto-topup
    const { data: refreshed } = await supabase
      .from("users")
      .select("credits_balance")
      .eq("id", userId)
      .single();
    if (!refreshed || refreshed.credits_balance < amount) {
      return { success: false, error: "Insufficient credits after auto-topup attempt." };
    }
    user.credits_balance = refreshed.credits_balance;
  }

  const newBalance = user.credits_balance - amount;

  // Update balance
  const { error: updateError } = await supabase
    .from("users")
    .update({ credits_balance: newBalance })
    .eq("id", userId);

  if (updateError) {
    console.error("Credit deduction failed:", updateError);
    return { success: false, error: `Failed to update credits: ${updateError.message}` };
  }

  console.log(`[Credits] Deducted ${amount} from user ${userId}. New balance: ${newBalance}`);

  // Log transaction
  const { error: txError } = await supabase.from("credits_transactions").insert({
    user_id: userId,
    amount: -amount,
    type: "usage",
    description,
    reference_id: referenceId || null,
    balance_after: newBalance,
  });

  if (txError) {
    console.error("Credit transaction log failed:", txError);
  }

  // Check if balance dropped below 20% — send warning
  const planCredits = getPlanCredits(user.plan);
  const warningThreshold = Math.floor(planCredits * 0.2);

  if (newBalance <= warningThreshold && user.credits_balance > warningThreshold) {
    await sendLowCreditWarningChecked(
      userId,
      user.email,
      newBalance,
      planCredits,
      PLAN_NAMES[user.plan] || "Free"
    );
  }

  // Check if auto-topup should trigger based on threshold
  if (newBalance > 0) {
    await checkAutoTopupThreshold(userId, user, newBalance);
  }

  return { success: true, newBalance };
}

/**
 * Get the current user's credit balance.
 */
export async function getCredits() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("credits_balance, plan")
    .eq("id", user.id)
    .single();

  return data;
}

/**
 * Update auto-topup settings for the current user.
 */
export async function updateAutoTopupSettings(
  enabled: boolean,
  threshold: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Upsert autopilot_settings
  const { data: existing } = await supabase
    .from("autopilot_settings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase
      .from("autopilot_settings")
      .update({
        auto_topup_enabled: enabled,
        auto_topup_threshold: threshold,
      })
      .eq("user_id", user.id);
  } else {
    await supabase.from("autopilot_settings").insert({
      user_id: user.id,
      auto_topup_enabled: enabled,
      auto_topup_threshold: threshold,
    });
  }

  return { success: true };
}

/**
 * Get auto-topup settings for the current user.
 */
export async function getAutoTopupSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("autopilot_settings")
    .select("auto_topup_enabled, auto_topup_threshold")
    .eq("user_id", user.id)
    .single();

  return data || { auto_topup_enabled: false, auto_topup_threshold: 50 };
}

// --- Internal helpers ---

function getPlanCredits(plan: string): number {
  const credits: Record<string, number> = {
    free: 50,
    starter: 500,
    pro: 1500,
    agency: 5000,
  };
  return credits[plan] || 50;
}

/**
 * Try auto-topup when balance is insufficient.
 * Charges the smallest top-up pack that covers the deficit via Stripe.
 */
async function tryAutoTopup(
  userId: string,
  user: { credits_balance: number; plan: string; stripe_customer_id: string | null },
  amountNeeded: number
): Promise<{ success: boolean }> {
  // Only pro/agency can auto-topup
  if (user.plan !== "pro" && user.plan !== "agency") {
    return { success: false };
  }

  if (!user.stripe_customer_id) {
    return { success: false };
  }

  const supabase = await createClient();

  // Check if auto-topup is enabled
  const { data: settings } = await supabase
    .from("autopilot_settings")
    .select("auto_topup_enabled")
    .eq("user_id", userId)
    .single();

  if (!settings?.auto_topup_enabled) {
    return { success: false };
  }

  // Find smallest pack that covers the deficit
  const deficit = amountNeeded - user.credits_balance;
  const pack = TOPUP_PACKS.find((p) => p.credits >= deficit);
  if (!pack || !pack.priceId) {
    return { success: false };
  }

  try {
    const stripe = getStripe();
    // Create a payment intent and confirm immediately using customer's default payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pack.price * 100, // cents
      currency: "usd",
      customer: user.stripe_customer_id,
      off_session: true,
      confirm: true,
      metadata: {
        supabase_user_id: userId,
        auto_topup: "true",
        credits: String(pack.credits),
      },
    });

    if (paymentIntent.status === "succeeded") {
      const newBalance = user.credits_balance + pack.credits;
      await supabase
        .from("users")
        .update({ credits_balance: newBalance })
        .eq("id", userId);

      await supabase.from("credits_transactions").insert({
        user_id: userId,
        amount: pack.credits,
        type: "purchase",
        description: `Auto top-up — ${pack.name} (${pack.credits} credits)`,
        reference_id: paymentIntent.id,
        balance_after: newBalance,
      });

      return { success: true };
    }
  } catch (err) {
    console.error("Auto-topup failed:", err);
  }

  return { success: false };
}

/**
 * Check if balance dropped below auto-topup threshold and trigger top-up.
 */
async function checkAutoTopupThreshold(
  userId: string,
  user: { credits_balance: number; plan: string; stripe_customer_id: string | null },
  currentBalance: number
) {
  if (user.plan !== "pro" && user.plan !== "agency") return;
  if (!user.stripe_customer_id) return;

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("autopilot_settings")
    .select("auto_topup_enabled, auto_topup_threshold")
    .eq("user_id", userId)
    .single();

  if (!settings?.auto_topup_enabled) return;
  if (currentBalance > settings.auto_topup_threshold) return;

  // Find the "Small" pack (300 credits) as the default threshold top-up
  const pack = TOPUP_PACKS.find((p) => p.name === "Small");
  if (!pack || !pack.priceId) return;

  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pack.price * 100,
      currency: "usd",
      customer: user.stripe_customer_id,
      off_session: true,
      confirm: true,
      metadata: {
        supabase_user_id: userId,
        auto_topup: "true",
        credits: String(pack.credits),
      },
    });

    if (paymentIntent.status === "succeeded") {
      const newBalance = currentBalance + pack.credits;
      await supabase
        .from("users")
        .update({ credits_balance: newBalance })
        .eq("id", userId);

      await supabase.from("credits_transactions").insert({
        user_id: userId,
        amount: pack.credits,
        type: "purchase",
        description: `Auto top-up (threshold: ${settings.auto_topup_threshold}) — ${pack.name} (${pack.credits} credits)`,
        reference_id: paymentIntent.id,
        balance_after: newBalance,
      });
    }
  } catch (err) {
    console.error("Threshold auto-topup failed:", err);
  }
}

async function sendLowCreditWarningChecked(
  userId: string,
  email: string,
  currentBalance: number,
  planCredits: number,
  planName: string
) {
  try {
    // sendCreditsLowEmail with userId handles preference checking + logging via sendEmail()
    await sendCreditsLowEmail(email, currentBalance, planCredits, planName, userId);
  } catch (err) {
    console.error("Failed to send low credit warning:", err);
  }
}
