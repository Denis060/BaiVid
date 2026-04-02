import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { generateAvatarVideo, type AvatarStyle } from "@/lib/did";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface AvatarVideoEvent {
  data: {
    videoId: string;
    userId: string;
    script: string;
    photoUrl: string;
    voiceSampleUrl?: string;
    voiceId?: string;
    style: AvatarStyle;
    duration: number;
  };
}

export const avatarVideoFunction = inngest.createFunction(
  {
    id: "avatar-video-create",
    retries: 1,
    triggers: [{ event: "video/create-avatar" }],
  },
  async ({ event, step }) => {
    const { videoId, userId, script, photoUrl, voiceSampleUrl, voiceId, style, duration } =
      event.data as AvatarVideoEvent["data"];

    const supabase = getServiceClient();

    // Update status
    await step.run("update-status-generating", async () => {
      await supabase
        .from("videos")
        .update({ status: "generating" })
        .eq("id", videoId);
    });

    // Generate avatar video via D-ID
    const didResult = await step.run("generate-did-video", async () => {
      return await generateAvatarVideo({
        photoUrl,
        script,
        voiceSampleUrl,
        voiceId,
        style,
      });
    });

    // Download and re-upload to Supabase Storage
    const storageUrl = await step.run("upload-to-storage", async () => {
      const res = await fetch(didResult.videoUrl);
      if (!res.ok) throw new Error("Failed to download D-ID video");

      const buffer = Buffer.from(await res.arrayBuffer());
      const fileName = `${userId}/${videoId}.mp4`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, buffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: publicUrl } = supabase.storage
        .from("videos")
        .getPublicUrl(fileName);

      return publicUrl.publicUrl;
    });

    // Update video record
    await step.run("update-video-record", async () => {
      await supabase
        .from("videos")
        .update({
          status: "completed",
          video_url: storageUrl,
          duration: Math.round(duration),
          model_used: "d-id",
        })
        .eq("id", videoId);
    });

    // Deduct credits (20 per minute)
    await step.run("deduct-credits", async () => {
      const durationMinutes = Math.max(1, Math.ceil(duration / 60));
      const creditCost = 20 * durationMinutes;

      const { data: user } = await supabase
        .from("users")
        .select("credits_balance")
        .eq("id", userId)
        .single();

      if (user) {
        const newBalance = Math.max(0, user.credits_balance - creditCost);
        await supabase
          .from("users")
          .update({ credits_balance: newBalance })
          .eq("id", userId);

        await supabase.from("credits_transactions").insert({
          user_id: userId,
          amount: -creditCost,
          type: "usage",
          description: `Avatar video (${durationMinutes}min, D-ID, ${style})`,
          reference_id: videoId,
          balance_after: newBalance,
        });
      }
    });

    return { videoId, status: "completed" };
  }
);
