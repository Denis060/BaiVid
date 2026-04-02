"use server";

import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest";
import type { EditInstruction } from "@/lib/editor-types";
import { getPresetTracks, type MusicTrack } from "@/lib/music-service";

export async function getVideoForEditor(videoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function submitRerender(
  videoId: string,
  instructions: EditInstruction[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check credits
  const { data: profile } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_balance < 3) {
    return { error: `Insufficient credits. Need 3, have ${profile?.credits_balance || 0}.` };
  }

  // Save edit instructions to video metadata
  const { data: video } = await supabase
    .from("videos")
    .select("metadata")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video) return { error: "Video not found" };

  const metadata = (video.metadata as Record<string, unknown>) || {};
  metadata.editInstructions = instructions;

  await supabase
    .from("videos")
    .update({ status: "processing", metadata: JSON.parse(JSON.stringify(metadata)) })
    .eq("id", videoId);

  // Trigger rerender
  await inngest.send({
    name: "video/rerender",
    data: {
      videoId,
      userId: user.id,
      instructions,
    },
  });

  return { success: true };
}

export async function getMusicLibrary() {
  // Return preset music tracks from the music service
  const presetTracks = await getPresetTracks();
  return presetTracks.map((track: MusicTrack) => ({
    id: track.id,
    name: track.title,
    genre: track.genre,
    duration: track.duration,
    url: track.downloadUrl,
  }));
}
