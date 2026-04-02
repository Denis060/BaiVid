"use server";

import { createClient } from "@/lib/supabase/server";
import { sendAutopilotActivatedEmail } from "@/lib/email";
import type { PlatformType } from "@/types";

export interface AutopilotProfileInput {
  name: string;
  niche: string;
  tone: string;
  videoType: "faceless" | "avatar";
  targetPlatforms: PlatformType[];
  postingFrequency: string;
  voiceProfileId?: string;
  artStyle: string;
  durationPref: string;
  approvalMode: string;
  keywords: string[];
  language: string;
  category?: string;
}

export async function saveAutopilotProfile(input: AutopilotProfileInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("autopilot_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const profileData = {
    user_id: user.id,
    name: input.name,
    niche: input.niche,
    tone: input.tone,
    video_type: input.videoType,
    target_platforms: input.targetPlatforms,
    posting_frequency: input.postingFrequency,
    voice_profile_id: input.voiceProfileId || null,
    art_style: input.artStyle,
    duration_pref: input.durationPref,
    approval_mode: input.approvalMode,
    keywords: input.keywords,
    language: input.language,
    category: input.category || null,
    is_active: true,
    requires_approval: input.approvalMode === "approve",
  };

  let profileId: string;

  if (existing) {
    await supabase
      .from("autopilot_profiles")
      .update(profileData)
      .eq("id", existing.id);
    profileId = existing.id;
  } else {
    const { data: created } = await supabase
      .from("autopilot_profiles")
      .insert(profileData)
      .select("id")
      .single();
    if (!created) return { error: "Failed to create profile" };
    profileId = created.id;
  }

  // Send activation email on first creation
  if (!existing) {
    const { data: userData } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id)
      .single();

    if (userData?.email) {
      try {
        await sendAutopilotActivatedEmail(
          userData.email,
          input.name,
          input.niche,
          input.postingFrequency,
          input.targetPlatforms.length
        );

        await supabase.from("email_logs").insert({
          user_id: user.id,
          type: "autopilot_activated",
          subject: `Autopilot "${input.name}" is now live!`,
          status: "sent",
        });
      } catch (err) {
        console.error("Failed to send autopilot activation email:", err);
      }
    }
  }

  return { success: true, profileId };
}

export async function getAutopilotProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("autopilot_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}

export async function toggleAutopilot(active: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("autopilot_profiles")
    .update({ is_active: active })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function getAutopilotRuns(limit: number = 10) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("autopilot_runs")
    .select("*, ideas(title), videos(title, video_url, status)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(limit);

  return data || [];
}
