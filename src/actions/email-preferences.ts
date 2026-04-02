"use server";

import { createClient } from "@/lib/supabase/server";

export interface EmailPreferencesInput {
  video_ready: boolean;
  credits_low: boolean;
  subscription_change: boolean;
  weekly_digest: boolean;
  autopilot_approval: boolean;
  marketing: boolean;
}

export async function getEmailPreferences() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("email_preferences")
    .select("video_ready, credits_low, subscription_change, weekly_digest, autopilot_approval, marketing")
    .eq("user_id", user.id)
    .single();

  return (
    data || {
      video_ready: true,
      credits_low: true,
      subscription_change: true,
      weekly_digest: true,
      autopilot_approval: true,
      marketing: true,
    }
  );
}

export async function updateEmailPreferences(prefs: EmailPreferencesInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("email_preferences")
    .update(prefs)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
