import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { createActor, submitTalk, getTalkStatus, type AvatarStyle } from "@/lib/did";
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

    // Update status to generating
    await step.run("update-status-generating", async () => {
      await supabase
        .from("videos")
        .update({ status: "generating" })
        .eq("id", videoId);
    });

    // Step 1: Create D-ID actor for reuse
    const actorId = await step.run("create-actor", async () => {
      try {
        return await createActor(photoUrl, voiceSampleUrl);
      } catch (err) {
        // Actor creation is optional — fall back to direct photoUrl
        console.warn("Actor creation failed, using photoUrl directly:", err);
        return null;
      }
    });

    // Step 2: Save actor to avatars table for reuse
    if (actorId) {
      await step.run("save-actor", async () => {
        await supabase.from("avatars").upsert(
          {
            user_id: userId,
            name: `Avatar ${new Date().toLocaleDateString()}`,
            did_avatar_id: actorId,
            is_default: false,
          },
          { onConflict: "did_avatar_id" }
        );
      });
    }

    // Step 3: Submit D-ID talk (does NOT poll — returns talkId immediately)
    const talkId = await step.run("submit-did-talk", async () => {
      return await submitTalk({
        actorId: actorId || undefined,
        photoUrl: actorId ? undefined : photoUrl,
        script,
        voiceSampleUrl,
        voiceId,
        style,
      });
    });

    // Step 4: Poll for D-ID completion using step.sleep() pattern
    let videoUrl: string | undefined;

    for (let attempt = 0; attempt < 120; attempt++) {
      await step.sleep(`poll-did-${attempt}`, "5s");

      const status = await step.run(`check-did-status-${attempt}`, async () => {
        return await getTalkStatus(talkId);
      });

      if (status.status === "done" && status.videoUrl) {
        videoUrl = status.videoUrl;
        break;
      }

      if (status.status === "error") {
        // Mark video as failed and exit
        await step.run("mark-failed", async () => {
          await supabase
            .from("videos")
            .update({
              status: "failed",
              error_message: status.error || "D-ID generation failed",
              model_used: "d-id",
            })
            .eq("id", videoId);
        });
        return { videoId, status: "failed", error: status.error };
      }
    }

    if (!videoUrl) {
      await step.run("mark-timeout", async () => {
        await supabase
          .from("videos")
          .update({
            status: "failed",
            error_message: "D-ID generation timed out after 10 minutes",
            model_used: "d-id",
          })
          .eq("id", videoId);
      });
      return { videoId, status: "failed", error: "Timed out" };
    }

    // Step 5: Download and re-upload to Supabase Storage
    const storageUrl = await step.run("upload-to-storage", async () => {
      const res = await fetch(videoUrl!);
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

    // Step 6: Update video record
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

    // Step 7: Deduct credits (20 per minute)
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

    return { videoId, status: "completed", actorId };
  }
);
