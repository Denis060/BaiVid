"use server";

import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest";
import type { PlatformType } from "@/types";

export interface SchedulePostInput {
  videoId: string;
  platform: PlatformType;
  connectedAccountId: string;
  scheduledAt: string; // ISO string
}

export async function schedulePost(input: SchedulePostInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: post, error } = await supabase
    .from("scheduled_posts")
    .insert({
      user_id: user.id,
      video_id: input.videoId,
      platform: input.platform,
      connected_account_id: input.connectedAccountId,
      scheduled_at: input.scheduledAt,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!post) return { error: "Failed to create scheduled post" };

  // Send delayed Inngest event
  await inngest.send({
    name: "post/publish-scheduled",
    data: {
      postId: post.id,
      userId: user.id,
      videoId: input.videoId,
      platform: input.platform,
      connectedAccountId: input.connectedAccountId,
    },
  });

  return { success: true, postId: post.id };
}

export async function cancelScheduledPost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("scheduled_posts")
    .update({ status: "cancelled" })
    .eq("id", postId)
    .eq("user_id", user.id)
    .eq("status", "scheduled");

  if (error) return { error: error.message };
  return { success: true };
}

export async function reschedulePost(postId: string, newScheduledAt: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get the post details for re-firing Inngest
  const { data: post, error: fetchError } = await supabase
    .from("scheduled_posts")
    .select("video_id, platform, connected_account_id")
    .eq("id", postId)
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .single();

  if (fetchError || !post) return { error: "Post not found or not schedulable" };

  // Update the scheduled time
  const { error } = await supabase
    .from("scheduled_posts")
    .update({ scheduled_at: newScheduledAt })
    .eq("id", postId);

  if (error) return { error: error.message };

  // Re-fire Inngest event so the new step.sleep() uses the updated time
  // The old event's step.sleep() will wake up, re-check status, and find the
  // updated scheduled_at — but sending a fresh event ensures reliability
  await inngest.send({
    name: "post/publish-scheduled",
    data: {
      postId,
      userId: user.id,
      videoId: post.video_id,
      platform: post.platform,
      connectedAccountId: post.connected_account_id,
    },
  });

  return { success: true };
}

export async function getScheduledPosts(from?: string, to?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("scheduled_posts")
    .select("*, videos(title, video_url, thumbnail_url, type, duration), connected_accounts(platform_username)")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (from) query = query.gte("scheduled_at", from);
  if (to) query = query.lte("scheduled_at", to);

  const { data } = await query;
  return data || [];
}

export async function getConnectedAccounts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("connected_accounts")
    .select("id, platform, platform_username, platform_user_id, created_at")
    .eq("user_id", user.id);

  return data || [];
}

export async function disconnectAccount(accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("connected_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function getReadyVideos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("videos")
    .select("id, title, type, duration, thumbnail_url")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}
