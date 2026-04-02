"use server";

import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest";

export async function getVoiceProfiles() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("voice_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return data || [];
}

export async function createVoiceProfile(input: {
  name: string;
  sampleUrl: string;
  language: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Create a pending profile
  const { data: profile, error } = await supabase
    .from("voice_profiles")
    .insert({
      user_id: user.id,
      name: input.name,
      provider: "fish_audio",
      provider_voice_id: "pending",
      language: input.language,
      sample_url: input.sampleUrl,
      is_default: false,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!profile) return { error: "Failed to create profile" };

  // Trigger voice cloning via Inngest
  await inngest.send({
    name: "voice/clone",
    data: {
      profileId: profile.id,
      userId: user.id,
      sampleUrl: input.sampleUrl,
      name: input.name,
    },
  });

  return { success: true, profileId: profile.id };
}

export async function savePresetVoice(input: {
  name: string;
  providerVoiceId: string;
  language: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("voice_profiles").insert({
    user_id: user.id,
    name: input.name,
    provider: "fish_audio",
    provider_voice_id: input.providerVoiceId,
    language: input.language,
    is_default: false,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function setDefaultVoice(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Unset all defaults
  await supabase
    .from("voice_profiles")
    .update({ is_default: false })
    .eq("user_id", user.id);

  // Set new default
  const { error } = await supabase
    .from("voice_profiles")
    .update({ is_default: true })
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteVoiceProfile(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("voice_profiles")
    .delete()
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
