"use server";

import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest";
import { redirect } from "next/navigation";

export interface CreateFacelessVideoInput {
  script: string;
  title: string;
  artStyle: string;
  voiceId: string;
  duration: number; // seconds
  aspectRatio: "16:9" | "9:16" | "1:1";
  scriptId?: string;
}

export async function createFacelessVideo(input: CreateFacelessVideoInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check credits
  const durationMinutes = Math.max(1, Math.ceil(input.duration / 60));
  const creditCost = 15 * durationMinutes;

  const { data: profile } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_balance < creditCost) {
    return {
      error: `Insufficient credits. You need ${creditCost} but have ${profile?.credits_balance || 0}.`,
    };
  }

  // Create video record
  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      user_id: user.id,
      title: input.title,
      type: "faceless",
      status: "draft",
      script_id: input.scriptId || null,
      art_style: input.artStyle,
      aspect_ratio: input.aspectRatio,
      credits_used: creditCost,
      metadata: {
        voiceId: input.voiceId,
        targetDuration: input.duration,
      },
    })
    .select("id")
    .single();

  if (insertError || !video) {
    return { error: "Failed to create video record" };
  }

  // Trigger Inngest background job
  await inngest.send({
    name: "video/create-faceless",
    data: {
      videoId: video.id,
      userId: user.id,
      script: input.script,
      artStyle: input.artStyle,
      voiceId: input.voiceId,
      duration: input.duration,
      aspectRatio: input.aspectRatio,
    },
  });

  redirect("/videos");
}

export interface CreateAvatarVideoInput {
  title: string;
  script: string;
  photoUrl: string;
  voiceSampleUrl?: string;
  voiceId?: string;
  style: "solo_host" | "interview" | "news_anchor" | "storyteller";
  duration: number;
  scriptId?: string;
}

export async function createAvatarVideo(input: CreateAvatarVideoInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const durationMinutes = Math.max(1, Math.ceil(input.duration / 60));
  const creditCost = 20 * durationMinutes;

  const { data: profile } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_balance < creditCost) {
    return {
      error: `Insufficient credits. You need ${creditCost} but have ${profile?.credits_balance || 0}.`,
    };
  }

  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      user_id: user.id,
      title: input.title,
      type: "avatar",
      status: "draft",
      script_id: input.scriptId || null,
      credits_used: creditCost,
      metadata: {
        photoUrl: input.photoUrl,
        voiceSampleUrl: input.voiceSampleUrl,
        style: input.style,
        targetDuration: input.duration,
      },
    })
    .select("id")
    .single();

  if (insertError || !video) {
    return { error: "Failed to create video record" };
  }

  await inngest.send({
    name: "video/create-avatar",
    data: {
      videoId: video.id,
      userId: user.id,
      script: input.script,
      photoUrl: input.photoUrl,
      voiceSampleUrl: input.voiceSampleUrl,
      voiceId: input.voiceId,
      style: input.style,
      duration: input.duration,
    },
  });

  redirect("/videos");
}

// ========================================
// Audio to Video
// ========================================

export interface CreateAudioVideoInput {
  title: string;
  audioUrl: string;
  artStyle: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  durationSeconds: number;
}

export async function createAudioVideo(input: CreateAudioVideoInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const durationMinutes = Math.max(1, Math.ceil(input.durationSeconds / 60));
  const creditCost = 12 * durationMinutes;

  const { data: profile } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_balance < creditCost) {
    return { error: `Insufficient credits. Need ${creditCost}, have ${profile?.credits_balance || 0}.` };
  }

  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      user_id: user.id,
      title: input.title,
      type: "audio",
      status: "draft",
      art_style: input.artStyle,
      aspect_ratio: input.aspectRatio,
      credits_used: creditCost,
      metadata: { audioUrl: input.audioUrl, targetDuration: input.durationSeconds },
    })
    .select("id")
    .single();

  if (insertError || !video) return { error: "Failed to create video record" };

  await inngest.send({
    name: "video/create-audio",
    data: {
      videoId: video.id,
      userId: user.id,
      audioUrl: input.audioUrl,
      artStyle: input.artStyle,
      aspectRatio: input.aspectRatio,
      durationSeconds: input.durationSeconds,
    },
  });

  redirect("/videos");
}

// ========================================
// URL to Video
// ========================================

export interface CreateUrlVideoInput {
  title: string;
  url: string;
  content: string;
  artStyle: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  duration: number;
}

export async function createUrlVideo(input: CreateUrlVideoInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const creditCost = 18;

  const { data: profile } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_balance < creditCost) {
    return { error: `Insufficient credits. Need ${creditCost}, have ${profile?.credits_balance || 0}.` };
  }

  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      user_id: user.id,
      title: input.title,
      type: "url",
      status: "draft",
      art_style: input.artStyle,
      aspect_ratio: input.aspectRatio,
      credits_used: creditCost,
      metadata: { sourceUrl: input.url, content: input.content, targetDuration: input.duration },
    })
    .select("id")
    .single();

  if (insertError || !video) return { error: "Failed to create video record" };

  await inngest.send({
    name: "video/create-url",
    data: {
      videoId: video.id,
      userId: user.id,
      title: input.title,
      content: input.content,
      artStyle: input.artStyle,
      aspectRatio: input.aspectRatio,
      duration: input.duration,
    },
  });

  redirect("/videos");
}

/**
 * Scrape a URL and return extracted content.
 */
export async function fetchUrlContent(url: string) {
  const { scrapeUrl } = await import("@/lib/scraper");
  try {
    return await scrapeUrl(url);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch URL" };
  }
}

/**
 * Delete a video.
 */
export async function deleteVideo(videoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Delete from storage
  const { data: video } = await supabase
    .from("videos")
    .select("video_url")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (video?.video_url) {
    const path = video.video_url.split("/videos/").pop();
    if (path) {
      await supabase.storage.from("videos").remove([path]);
    }
  }

  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", videoId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Get videos with optional filter.
 */
export async function getVideos(
  filter: "all" | "processing" | "completed" | "failed" | "autopilot" = "all",
  search: string = "",
  page: number = 1,
  limit: number = 20
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { videos: [], count: 0 };

  const offset = (page - 1) * limit;

  let query = supabase
    .from("videos")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  if (filter === "processing") {
    query = query.in("status", ["draft", "scripting", "generating", "processing"]);
  } else if (filter === "completed") {
    query = query.eq("status", "completed");
  } else if (filter === "failed") {
    query = query.eq("status", "failed");
  } else if (filter === "autopilot") {
    query = query.eq("is_autopilot", true);
  }

  if (search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { videos: data || [], count: count || 0 };
}

/**
 * Rename a video.
 */
export async function renameVideo(videoId: string, title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("videos")
    .update({ title })
    .eq("id", videoId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Get a signed download URL for a video (1 hour expiry).
 */
export async function getVideoDownloadUrl(videoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: video } = await supabase
    .from("videos")
    .select("video_url")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video?.video_url) return { error: "Video not found" };

  // Extract storage path from public URL
  const path = video.video_url.split("/videos/").pop();
  if (!path) return { error: "Invalid video URL" };

  const { data: signedUrl, error: signError } = await supabase.storage
    .from("videos")
    .createSignedUrl(path, 3600); // 1 hour

  if (signError) return { error: signError.message };
  return { url: signedUrl.signedUrl };
}
