import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { deductCreditsService } from "@/lib/credits-service";
import { routeVideoGeneration } from "@/lib/providers/video-router";
import { assembleVideo } from "@/lib/ffmpeg";
import { getGeminiFlash } from "@/lib/gemini";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const audioVideoFunction = inngest.createFunction(
  {
    id: "audio-video-create",
    retries: 1,
    triggers: [{ event: "video/create-audio" }],
  },
  async ({ event, step }) => {
    const { videoId, userId, audioUrl, artStyle, aspectRatio, durationSeconds } =
      event.data as {
        videoId: string;
        userId: string;
        audioUrl: string;
        artStyle: string;
        aspectRatio: "16:9" | "9:16" | "1:1";
        durationSeconds: number;
      };

    const supabase = getServiceClient();

    await step.run("update-status", async () => {
      await supabase.from("videos").update({ status: "generating" }).eq("id", videoId);
    });

    // Transcribe audio via Whisper (or generate visual prompts from audio context)
    const scenePrompts = await step.run("generate-scene-prompts", async () => {
      const model = getGeminiFlash();
      const result = await model.generateContent(
        `Generate 5 visual scene descriptions for a video with ${artStyle} art style, ${durationSeconds} seconds long. The audio is a podcast/narration. Return JSON array of strings, each describing a visual scene to accompany audio narration. Only JSON array, no markdown.`
      );
      const text = result.response.text().replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      try {
        return JSON.parse(text) as string[];
      } catch {
        return [`${artStyle} style background visual`, `Abstract ${artStyle} motion graphics`, `Professional ${artStyle} b-roll footage`];
      }
    });

    // Generate visuals for each scene
    const sceneUrls = await step.run("generate-scenes", async () => {
      const urls: string[] = [];
      for (const prompt of scenePrompts.slice(0, 5)) {
        try {
          const result = await routeVideoGeneration({
            prompt: `${prompt}. Style: ${artStyle}. High quality.`,
            duration: Math.min(10, Math.ceil(durationSeconds / scenePrompts.length)),
            aspectRatio,
            style: artStyle,
          });
          urls.push(result.videoUrl);
        } catch {
          // Skip failed scenes
        }
      }
      return urls;
    });

    if (sceneUrls.length === 0) {
      await step.run("mark-failed", async () => {
        await supabase.from("videos").update({
          status: "failed",
          error_message: "Failed to generate visual scenes",
        }).eq("id", videoId);
      });
      return { videoId, status: "failed" };
    }

    // Assemble with original audio
    const assembled = await step.run("assemble", async () => {
      await supabase.from("videos").update({ status: "processing" }).eq("id", videoId);
      return await assembleVideo({
        sceneUrls,
        voiceoverUrl: audioUrl,
        aspectRatio,
      });
    });

    // Upload
    const storageUrl = await step.run("upload", async () => {
      let buffer: Buffer;
      if (assembled.outputPath.startsWith("http")) {
        const res = await fetch(assembled.outputPath);
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        buffer = Buffer.from(await res.arrayBuffer());
      } else {
        const { readFile } = await import("fs/promises");
        buffer = await readFile(assembled.outputPath);
        const { unlink } = await import("fs/promises");
        await unlink(assembled.outputPath).catch(() => {});
      }
      const fileName = `${userId}/${videoId}.mp4`;
      await supabase.storage.from("videos").upload(fileName, buffer, {
        contentType: "video/mp4", upsert: true,
      });
      const { data } = supabase.storage.from("videos").getPublicUrl(fileName);
      return data.publicUrl;
    });

    // Finalize
    await step.run("finalize", async () => {
      await supabase.from("videos").update({
        status: "completed",
        video_url: storageUrl,
        duration: Math.round(assembled.durationSeconds),
        model_used: "audio-to-video",
      }).eq("id", videoId);

      const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
      const creditCost = 10 * durationMinutes;
      await deductCreditsService(userId, creditCost, `Audio-to-video (${durationMinutes}min)`, videoId);
    });

    return { videoId, status: "completed" };
  }
);
