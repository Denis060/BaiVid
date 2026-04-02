import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/encryption";
import { deductCreditsService } from "@/lib/credits-service";
import { getGeminiFlash } from "@/lib/gemini";
import { getTrendingData } from "@/lib/trends";
import { routeVideoGeneration } from "@/lib/providers/video-router";
import { generateFishAudioTTS } from "@/lib/providers/fish-audio";
import { assembleVideo } from "@/lib/ffmpeg";
import { publishToplatform, type PlatformKey } from "@/lib/publishers";
import { sendAutopilotApprovalEmail } from "@/lib/email";
import { randomUUID } from "crypto";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ========================================
// 1. Daily Cron — fans out to all active users
// ========================================
export const autopilotDailyCron = inngest.createFunction(
  {
    id: "autopilot-daily-cron",
    triggers: [{ cron: "0 6 * * *" }], // 6 AM UTC daily
  },
  async ({ step }) => {
    const supabase = getServiceClient();

    const profiles = await step.run("fetch-active-profiles", async () => {
      const { data } = await supabase
        .from("autopilot_profiles")
        .select("id, user_id")
        .eq("is_active", true);
      return data || [];
    });

    // Fan out — send event for each active profile
    if (profiles.length > 0) {
      await step.run("fan-out", async () => {
        const events = profiles.map((p) => ({
          name: "autopilot/run-for-user" as const,
          data: { profileId: p.id, userId: p.user_id },
        }));
        await inngest.send(events);
      });
    }

    return { triggered: profiles.length };
  }
);

// ========================================
// 2. Run for User — full 13-step pipeline
// ========================================
export const autopilotRunForUser = inngest.createFunction(
  {
    id: "autopilot-run-for-user",
    retries: 1,
    triggers: [{ event: "autopilot/run-for-user" }],
  },
  async ({ event, step }) => {
    const { profileId, userId } = event.data as { profileId: string; userId: string };
    const supabase = getServiceClient();

    // Step 1: Load profile and check credits
    const profile = await step.run("load-profile", async () => {
      const { data } = await supabase
        .from("autopilot_profiles")
        .select("*")
        .eq("id", profileId)
        .single();
      if (!data) throw new Error("Profile not found");
      return data;
    });

    const user = await step.run("check-credits", async () => {
      const { data } = await supabase
        .from("users")
        .select("credits_balance, email")
        .eq("id", userId)
        .single();
      if (!data) throw new Error("User not found");
      if (data.credits_balance < profile.max_credits_per_run) {
        throw new Error(`Insufficient credits: ${data.credits_balance} < ${profile.max_credits_per_run}`);
      }
      return data;
    });

    // Step 2: Create run record
    const runId = await step.run("create-run", async () => {
      const { data } = await supabase
        .from("autopilot_runs")
        .insert({
          user_id: userId,
          profile_id: profileId,
          status: "running",
          run_date: new Date().toISOString().split("T")[0],
        })
        .select("id")
        .single();
      if (!data) throw new Error("Failed to create run");
      return data.id;
    });

    // Step 3: Generate idea using trends + Gemini
    const idea = await step.run("generate-idea", async () => {
      const trends = await getTrendingData(profile.niche, "US", 5);
      const trendContext = trends.map((t) => t.keyword).join(", ");

      const model = getGeminiFlash();
      const result = await model.generateContent(
        `Generate ONE trending video idea for the "${profile.niche}" niche. Current trends: ${trendContext}. Tone: ${profile.tone}. Return JSON: { "title": "...", "description": "...", "category": "${profile.niche}" }. Only JSON, no markdown.`
      );
      const text = result.response.text().replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(text) as { title: string; description: string; category: string };
    });

    // Step 4: Save idea
    const ideaId = await step.run("save-idea", async () => {
      const { data } = await supabase
        .from("ideas")
        .insert({
          user_id: userId,
          title: idea.title,
          description: idea.description,
          category: idea.category,
          status: "new",
          source: `autopilot:${profileId}`,
        })
        .select("id")
        .single();
      return data?.id;
    });

    // Step 5: Generate script
    const script = await step.run("generate-script", async () => {
      const model = getGeminiFlash();
      const platforms = (profile.target_platforms || []).join(", ") || "youtube";
      const result = await model.generateContent(
        `Write a ${profile.duration_pref || "60s"} video script about "${idea.title}" for ${platforms}. Tone: ${profile.tone}. Include [HOOK], scene markers, and [CTA]. Return the full script text only.`
      );
      return result.response.text();
    });

    // Step 6: Save script
    const scriptId = await step.run("save-script", async () => {
      const wordCount = script.split(/\s+/).length;
      const { data } = await supabase
        .from("scripts")
        .insert({
          user_id: userId,
          idea_id: ideaId || null,
          title: idea.title,
          content: script,
          tone: profile.tone,
          word_count: wordCount,
        })
        .select("id")
        .single();
      return data?.id;
    });

    // Step 7: Check if approval is needed
    if (profile.requires_approval || profile.approval_mode === "approve") {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

      await step.run("create-approval", async () => {
        await supabase.from("autopilot_approvals").insert({
          user_id: userId,
          run_id: runId,
          stage: "script",
          content: { title: idea.title, script: script.slice(0, 500) },
          status: "pending",
          token,
          expires_at: expiresAt,
        });
      });

      await step.run("send-approval-email", async () => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://baivid.com";
        await sendAutopilotApprovalEmail(
          user.email,
          profile.name,
          "script",
          `${baseUrl}/api/autopilot/approve?token=${token}`,
          `${baseUrl}/api/autopilot/reject?token=${token}`
        );
      });

      // Wait for approval event (max 2 hours)
      const approval = await step.waitForEvent("wait-for-approval", {
        event: "autopilot/approval-decision",
        match: "data.runId",
        timeout: "2h",
      });

      if (!approval || approval.data.decision === "rejected") {
        await step.run("mark-rejected", async () => {
          await supabase
            .from("autopilot_runs")
            .update({ status: "failed", error_message: "Rejected by user" })
            .eq("id", runId);
        });
        return { runId, status: "rejected" };
      }
    }

    // Step 8: Create video record
    const videoId = await step.run("create-video", async () => {
      const { data } = await supabase
        .from("videos")
        .insert({
          user_id: userId,
          title: idea.title,
          type: profile.video_type || "faceless",
          status: "generating",
          script_id: scriptId || null,
          is_autopilot: true,
          autopilot_run_id: runId,
          art_style: profile.art_style || "cinematic",
          aspect_ratio: "9:16",
        })
        .select("id")
        .single();
      if (!data) throw new Error("Failed to create video");
      return data.id;
    });

    // Step 9: Generate video scenes
    const sceneUrl = await step.run("generate-video", async () => {
      const result = await routeVideoGeneration({
        prompt: `${idea.title}. ${idea.description}. Style: ${profile.art_style || "cinematic"}`,
        duration: 10,
        aspectRatio: "9:16",
        style: profile.art_style || "cinematic",
      });
      return { url: result.videoUrl, provider: result.provider };
    });

    // Step 10: Generate voiceover
    const voiceover = await step.run("generate-voiceover", async () => {
      try {
        const voiceId = profile.voice_profile_id || "default-male-1";
        return await generateFishAudioTTS({
          text: script.replace(/\[.*?\]/g, "").trim(),
          voiceId,
        });
      } catch {
        return null;
      }
    });

    // Step 11: Assemble video
    const assembled = await step.run("assemble-video", async () => {
      await supabase.from("videos").update({ status: "processing" }).eq("id", videoId);
      return await assembleVideo({
        sceneUrls: [sceneUrl.url],
        voiceoverUrl: voiceover?.audioUrl,
        aspectRatio: "9:16",
      });
    });

    // Step 12: Upload and update
    const storageUrl = await step.run("upload-video", async () => {
      const { readFile } = await import("fs/promises");
      const buffer = await readFile(assembled.outputPath);
      const fileName = `${userId}/${videoId}.mp4`;

      await supabase.storage.from("videos").upload(fileName, buffer, {
        contentType: "video/mp4",
        upsert: true,
      });

      const { data: publicUrl } = supabase.storage.from("videos").getPublicUrl(fileName);

      const { unlink } = await import("fs/promises");
      await unlink(assembled.outputPath).catch(() => {});

      return publicUrl.publicUrl;
    });

    await step.run("update-video-complete", async () => {
      await supabase.from("videos").update({
        status: "completed",
        video_url: storageUrl,
        duration: Math.round(assembled.durationSeconds),
        model_used: sceneUrl.provider,
      }).eq("id", videoId);
    });

    // Step 13: Publish to connected platforms
    const platforms = (profile.target_platforms || []) as PlatformKey[];
    const publishResults: Record<string, { success: boolean; error?: string }> = {};

    for (const platform of platforms) {
      const result = await step.run(`publish-${platform}`, async () => {
        // Get connected account
        const { data: account } = await supabase
          .from("connected_accounts")
          .select("*")
          .eq("user_id", userId)
          .eq("platform", platform)
          .single();

        if (!account) {
          return { success: false, error: `No connected ${platform} account` };
        }

        const publishResult = await publishToplatform(platform, {
          videoUrl: storageUrl,
          title: idea.title,
          description: idea.description || "",
          accessToken: decrypt(account.access_token),
          platformUserId: account.platform_user_id,
        });

        // Log to scheduled_posts
        await supabase.from("scheduled_posts").insert({
          user_id: userId,
          video_id: videoId,
          platform,
          connected_account_id: account.id,
          scheduled_at: new Date().toISOString(),
          published_at: publishResult.success ? new Date().toISOString() : null,
          status: publishResult.success ? "published" : "failed",
          platform_post_id: publishResult.postId || null,
          error_message: publishResult.error || null,
        });

        return publishResult;
      });

      publishResults[platform] = result;
    }

    // Deduct credits and finalize run
    await step.run("deduct-credits-finalize", async () => {
      const creditCost = 15;
      await deductCreditsService(userId, creditCost, `Autopilot: ${idea.title}`, runId);

      const postedPlatforms = Object.entries(publishResults)
        .filter(([, r]) => r.success)
        .map(([p]) => p);

      await supabase.from("autopilot_runs").update({
        status: "completed",
        idea_id: ideaId,
        script_id: scriptId,
        video_id: videoId,
        credits_used: creditCost,
        platforms_posted: postedPlatforms,
        completed_at: new Date().toISOString(),
      }).eq("id", runId);
    });

    return { runId, videoId, status: "completed", publishResults };
  }
);

// ========================================
// 3. Approval Decision Handler
// ========================================
export const autopilotApprovalDecision = inngest.createFunction(
  {
    id: "autopilot-approval-decision",
    triggers: [{ event: "autopilot/approval-decision" }],
  },
  async ({ event }) => {
    // This function exists to emit the event that step.waitForEvent listens for.
    // The actual logic is handled by the waiting run-for-user function.
    return { decision: event.data.decision, runId: event.data.runId };
  }
);
