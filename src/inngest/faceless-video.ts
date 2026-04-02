import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { deductCreditsService } from "@/lib/credits-service";
import { routeVideoGeneration } from "@/lib/providers/video-router";
import { assembleVideo, type CaptionEntry } from "@/lib/ffmpeg";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface FacelessVideoEvent {
  data: {
    videoId: string;
    userId: string;
    script: string;
    artStyle: string;
    voiceId: string;
    duration: number;
    aspectRatio: "16:9" | "9:16" | "1:1";
  };
}

export const facelessVideoFunction = inngest.createFunction(
  {
    id: "faceless-video-create",
    retries: 1,
    triggers: [{ event: "video/create-faceless" }],
  },
  async ({ event, step }) => {
    const { videoId, userId, script, artStyle, voiceId, duration, aspectRatio } =
      event.data as FacelessVideoEvent["data"];

    const supabase = getServiceClient();

    try {
      // Update status to generating
      await step.run("update-status-generating", async () => {
        await supabase
          .from("videos")
          .update({ status: "generating" })
          .eq("id", videoId);
      });

      // Step 1: Parse script into scenes
      const scenes = await step.run("parse-scenes", async () => {
        return parseScriptToScenes(script, duration);
      });

      // Step 2: Generate video for each scene
      const sceneResults = await step.run("generate-scenes", async () => {
        const results: { url: string; provider: string }[] = [];

        for (const scene of scenes) {
          try {
            const result = await routeVideoGeneration({
              prompt: `${scene.visualPrompt}. Style: ${artStyle}. High quality, professional.`,
              duration: scene.duration,
              aspectRatio,
              style: artStyle,
              userId,
            });
            results.push({ url: result.videoUrl, provider: result.provider });
          } catch (err) {
            console.error(`Scene generation failed:`, err);
            results.push({ url: "", provider: "failed" });
          }
        }

        return results;
      });

      // Step 3: Generate voiceover
      const voiceover = await step.run("generate-voiceover", async () => {
        try {
          // Try Google TTS first if available
          if (process.env.GOOGLE_TTS_API_KEY) {
            const { routeTTS } = await import("@/lib/providers/tts-router");
            const result = await routeTTS({
              text: scenes.map((s) => s.narration).join(" "),
              voiceId,
              userId,
            });
            return result;
          }
          // Fallback to Fish Audio
          const { generateFishAudioTTS } = await import("@/lib/providers/fish-audio");
          const result = await generateFishAudioTTS({
            text: scenes.map((s) => s.narration).join(" "),
            voiceId,
          });
          return result;
        } catch (err) {
          console.error("Voiceover generation failed:", err);
          return null;
        }
      });

      const validSceneUrls = sceneResults
        .filter((r) => r.url && r.provider !== "failed")
        .map((r) => r.url);

      if (validSceneUrls.length === 0) {
        throw new Error("No scenes generated successfully. Check API keys for video providers.");
      }

      const modelUsed = sceneResults.find((r) => r.provider !== "failed")?.provider || "unknown";

      // Step 4: Try assembly, or use first scene directly
      let finalVideoUrl: string;
      let finalDuration = duration;

      try {
        const assembled = await step.run("assemble-video", async () => {
          await supabase
            .from("videos")
            .update({ status: "processing" })
            .eq("id", videoId);

          const captions = generateCaptionsFromScenes(scenes);

          return await assembleVideo({
            sceneUrls: validSceneUrls,
            voiceoverUrl: voiceover?.audioUrl,
            captions,
            aspectRatio,
          });
        });

        // Upload assembled file to storage
        finalVideoUrl = await step.run("upload-assembled", async () => {
          const { readFile } = await import("fs/promises");
          const fileBuffer = await readFile(assembled.outputPath);

          const fileName = `${userId}/${videoId}.mp4`;
          const { error: uploadError } = await supabase.storage
            .from("videos")
            .upload(fileName, fileBuffer, {
              contentType: "video/mp4",
              upsert: true,
            });

          if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

          const { data: publicUrl } = supabase.storage
            .from("videos")
            .getPublicUrl(fileName);

          const { unlink } = await import("fs/promises");
          await unlink(assembled.outputPath).catch(() => {});

          return publicUrl.publicUrl;
        });

        finalDuration = Math.round(assembled.durationSeconds);
      } catch (assemblyErr) {
        console.warn("Assembly failed, using first scene directly:", assemblyErr);

        // Fallback: use the first scene URL directly as the video
        // This works when no assembly tool is available (e.g. Vercel without Shotstack)
        finalVideoUrl = await step.run("use-scene-directly", async () => {
          // Download scene and re-upload to our storage
          const sceneUrl = validSceneUrls[0];
          const res = await fetch(sceneUrl);
          if (!res.ok) throw new Error("Failed to download scene video");

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
      }

      // Step 5: Update video record
      await step.run("update-video-record", async () => {
        await supabase
          .from("videos")
          .update({
            status: "completed",
            video_url: finalVideoUrl,
            duration: finalDuration,
            model_used: modelUsed,
            art_style: artStyle,
            aspect_ratio: aspectRatio,
          })
          .eq("id", videoId);
      });

      // Step 6: Deduct credits
      await step.run("deduct-credits", async () => {
        const durationMinutes = Math.max(1, Math.ceil(duration / 60));
        const creditCost = 13 * durationMinutes;
        await deductCreditsService(userId, creditCost, `Faceless video (${durationMinutes}min, ${modelUsed})`, videoId);
      });

      return { videoId, status: "completed", modelUsed };
    } catch (err) {
      // Top-level error handler — mark video as failed
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`Faceless video pipeline failed for ${videoId}:`, errorMsg);

      await step.run("mark-failed", async () => {
        await supabase
          .from("videos")
          .update({
            status: "failed",
            error_message: errorMsg.slice(0, 500),
          })
          .eq("id", videoId);
      });

      return { videoId, status: "failed", error: errorMsg };
    }
  }
);

// --- Helpers ---

interface SceneSegment {
  narration: string;
  visualPrompt: string;
  duration: number;
}

function parseScriptToScenes(
  script: string,
  targetDuration: number
): SceneSegment[] {
  const blocks = script
    .split(/\[SCENE \d+[^\]]*\]|\[HOOK\]|\[CTA\]|\n\n+/)
    .map((b) => b.trim())
    .filter((b) => b.length > 10);

  if (blocks.length === 0) {
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    const chunkSize = Math.max(1, Math.ceil(sentences.length / 5));
    const chunks: string[] = [];
    for (let i = 0; i < sentences.length; i += chunkSize) {
      chunks.push(sentences.slice(i, i + chunkSize).join(" ").trim());
    }
    return chunks.map((chunk) => ({
      narration: chunk,
      visualPrompt: extractVisualPrompt(chunk),
      duration: Math.round(targetDuration / chunks.length),
    }));
  }

  const sceneDuration = Math.round(targetDuration / blocks.length);

  return blocks.map((block) => {
    const visualMatch = block.match(/(?:📹|Visual:|visual_direction:)\s*(.+)/i);
    const narration = block
      .replace(/(?:📹|Visual:|visual_direction:)\s*.+/gi, "")
      .trim();

    return {
      narration,
      visualPrompt: visualMatch?.[1] || extractVisualPrompt(narration),
      duration: Math.min(sceneDuration, 10),
    };
  });
}

function extractVisualPrompt(narration: string): string {
  const cleaned = narration
    .replace(/['"]/g, "")
    .replace(/\b(the|a|an|is|are|was|were|and|or|but|in|on|at|to|for)\b/gi, "")
    .trim();
  return cleaned.slice(0, 200);
}

function generateCaptionsFromScenes(scenes: SceneSegment[]): CaptionEntry[] {
  const captions: CaptionEntry[] = [];
  let currentTime = 0;

  for (const scene of scenes) {
    const words = scene.narration.split(/\s+/);
    const chunkSize = 8;
    const wordsPerSecond = words.length / scene.duration;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      const chunkDuration = Math.min(
        chunk.split(/\s+/).length / wordsPerSecond,
        4
      );

      captions.push({
        startTime: currentTime,
        endTime: currentTime + chunkDuration,
        text: chunk,
      });

      currentTime += chunkDuration;
    }
  }

  return captions;
}
