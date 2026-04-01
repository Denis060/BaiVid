"use server";

import { createClient } from "@/lib/supabase/server";
import { getResend } from "@/lib/resend";

export type DeductResult = {
  success: boolean;
  error?: string;
  newBalance?: number;
};

/**
 * Deduct credits from a user's balance.
 * Checks balance, deducts, logs transaction, and triggers low-credit warning if below 20%.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string
): Promise<DeductResult> {
  const supabase = await createClient();

  // Get current balance and plan
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("credits_balance, plan, email")
    .eq("id", userId)
    .single();

  if (fetchError || !user) {
    return { success: false, error: "User not found" };
  }

  if (user.credits_balance < amount) {
    return {
      success: false,
      error: `Insufficient credits. You need ${amount} but have ${user.credits_balance}.`,
    };
  }

  const newBalance = user.credits_balance - amount;

  // Update balance
  const { error: updateError } = await supabase
    .from("users")
    .update({ credits_balance: newBalance })
    .eq("id", userId);

  if (updateError) {
    return { success: false, error: "Failed to update credits" };
  }

  // Log transaction
  await supabase.from("credits_transactions").insert({
    user_id: userId,
    amount: -amount,
    type: "usage",
    description,
    reference_id: referenceId || null,
    balance_after: newBalance,
  });

  // Check if balance dropped below 20% of plan allocation and send warning
  const planCredits = getPlanCredits(user.plan);
  const threshold = Math.floor(planCredits * 0.2);

  if (newBalance <= threshold && newBalance + amount > threshold) {
    // Balance just crossed below 20% — send low credit warning
    await sendLowCreditWarning(userId, user.email, newBalance, planCredits);
  }

  return { success: true, newBalance };
}

/**
 * Get the current user's credit balance (for client-side queries).
 */
export async function getCredits() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("credits_balance, plan")
    .eq("id", user.id)
    .single();

  return data;
}

function getPlanCredits(plan: string): number {
  const credits: Record<string, number> = {
    free: 50,
    starter: 500,
    pro: 1500,
    agency: 5000,
  };
  return credits[plan] || 50;
}

async function sendLowCreditWarning(
  userId: string,
  email: string,
  currentBalance: number,
  planCredits: number
) {
  const supabase = await createClient();

  // Check email preferences
  const { data: prefs } = await supabase
    .from("email_preferences")
    .select("credits_low")
    .eq("user_id", userId)
    .single();

  if (prefs && !prefs.credits_low) return;

  try {
    const { data: emailResult } = await getResend().emails.send({
      from: "Baivid <noreply@baivid.com>",
      to: email,
      subject: "Your Baivid credits are running low",
      html: `
        <h2>Credits Running Low</h2>
        <p>You have <strong>${currentBalance}</strong> credits remaining out of your ${planCredits} monthly allocation.</p>
        <p>To keep creating videos without interruption, consider topping up or upgrading your plan.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Buy More Credits</a></p>
      `,
    });

    await supabase.from("email_logs").insert({
      user_id: userId,
      type: "credits_low",
      subject: "Your Baivid credits are running low",
      resend_id: emailResult?.id || null,
      status: "sent",
    });
  } catch (err) {
    console.error("Failed to send low credit warning:", err);
  }
}
