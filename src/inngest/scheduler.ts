import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { publishToplatform, type PlatformKey } from "@/lib/publishers";
import { sendVideoPostedEmail, sendVideoFailedEmail } from "@/lib/email";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const publishScheduledPost = inngest.createFunction(
  {
    id: "publish-scheduled-post",
    retries: 2,
    triggers: [{ event: "post/publish-scheduled" }],
  },
  async ({ event, step }) => {
    const { postId, userId, videoId, platform, connectedAccountId } =
      event.data as {
        postId: string;
        userId: string;
        videoId: string;
        platform: PlatformKey;
        connectedAccountId: string;
      };

    const supabase = getServiceClient();

    // Wait until scheduled time
    const post = await step.run("check-schedule", async () => {
      const { data } = await supabase
        .from("scheduled_posts")
        .select("scheduled_at, status")
        .eq("id", postId)
        .single();
      return data;
    });

    if (!post || post.status === "cancelled") {
      return { postId, status: "cancelled" };
    }

    // Wait until scheduled time
    const scheduledAt = new Date(post.scheduled_at);
    const now = new Date();
    if (scheduledAt > now) {
      const waitMs = scheduledAt.getTime() - now.getTime();
      if (waitMs > 0) {
        await step.sleep("wait-for-schedule", `${Math.ceil(waitMs / 1000)}s`);
      }
    }

    // Re-check status (may have been cancelled during wait)
    const currentPost = await step.run("recheck-status", async () => {
      const { data } = await supabase
        .from("scheduled_posts")
        .select("status")
        .eq("id", postId)
        .single();
      return data;
    });

    if (currentPost?.status === "cancelled") {
      return { postId, status: "cancelled" };
    }

    // Update to publishing
    await step.run("mark-publishing", async () => {
      await supabase
        .from("scheduled_posts")
        .update({ status: "publishing" })
        .eq("id", postId);
    });

    // Get video and account details
    const details = await step.run("load-details", async () => {
      const { data: video } = await supabase
        .from("videos")
        .select("title, description, video_url")
        .eq("id", videoId)
        .single();

      const { data: account } = await supabase
        .from("connected_accounts")
        .select("access_token, platform_user_id")
        .eq("id", connectedAccountId)
        .single();

      const { data: user } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      return { video, account, email: user?.email };
    });

    if (!details.video?.video_url || !details.account) {
      await step.run("mark-failed-missing", async () => {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: "Video or connected account not found",
          })
          .eq("id", postId);
      });
      return { postId, status: "failed" };
    }

    // Publish
    const result = await step.run("publish", async () => {
      return await publishToplatform(platform, {
        videoUrl: details.video!.video_url!,
        title: details.video!.title || "Untitled",
        description: details.video!.description || "",
        accessToken: details.account!.access_token,
        platformUserId: details.account!.platform_user_id,
      });
    });

    // Update post status
    await step.run("update-status", async () => {
      await supabase
        .from("scheduled_posts")
        .update({
          status: result.success ? "published" : "failed",
          published_at: result.success ? new Date().toISOString() : null,
          platform_post_id: result.postId || null,
          error_message: result.error || null,
        })
        .eq("id", postId);
    });

    // Send notification email
    if (details.email) {
      await step.run("send-email", async () => {
        if (result.success) {
          await sendVideoPostedEmail(
            details.email!,
            userId,
            details.video!.title || "Untitled",
            platform,
            result.postUrl || "#"
          );
        } else {
          await sendVideoFailedEmail(
            details.email!,
            userId,
            details.video!.title || "Untitled",
            result.error || "Publishing failed"
          );
        }
      });
    }

    return { postId, status: result.success ? "published" : "failed" };
  }
);
