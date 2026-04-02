"use server";

import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest";
import type { EditInstruction } from "@/lib/editor-types";

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

  if (!profile || profile.credits_balance < 5) {
    return { error: `Insufficient credits. Need 5, have ${profile?.credits_balance || 0}.` };
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
  // Return preset music tracks
  return [
    { id: "upbeat-1", name: "Upbeat Corporate", genre: "Corporate", duration: 120, url: "" },
    { id: "chill-1", name: "Lo-fi Chill", genre: "Lo-fi", duration: 180, url: "" },
    { id: "epic-1", name: "Epic Cinematic", genre: "Cinematic", duration: 150, url: "" },
    { id: "funk-1", name: "Funky Groove", genre: "Funk", duration: 90, url: "" },
    { id: "ambient-1", name: "Ambient Calm", genre: "Ambient", duration: 240, url: "" },
    { id: "hiphop-1", name: "Hip Hop Beat", genre: "Hip Hop", duration: 120, url: "" },
    { id: "afro-1", name: "Afrobeats Vibe", genre: "Afrobeats", duration: 150, url: "" },
    { id: "edm-1", name: "EDM Drop", genre: "Electronic", duration: 120, url: "" },
    { id: "acoustic-1", name: "Acoustic Guitar", genre: "Acoustic", duration: 180, url: "" },
    { id: "jazz-1", name: "Smooth Jazz", genre: "Jazz", duration: 200, url: "" },
  ];
}
