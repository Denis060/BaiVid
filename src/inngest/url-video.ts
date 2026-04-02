import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { deductCreditsService } from "@/lib/credits-service";
import { getGeminiFlash } from "@/lib/gemini";
import { routeVideoGeneration } from "@/lib/providers/video-router";
import { generateFishAudioTTS } from "@/lib/providers/fish-audio";
import { assembleVideo } from "@/lib/ffmpeg";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const urlVideoFunction = inngest.createFunction(
  {
    id: "url-video-create",
    retries: 1,
    triggers: [{ event: "video/create-url" }],
  },
  async ({ event, step }) => {
    const { videoId, userId, title, content, artStyle, aspectRatio, duration } =
      event.data as {
        videoId: string;
        userId: string;
        title: string;
        content: string;
        artStyle: string;
        aspectRatio: "16:9" | "9:16" | "1:1";
        duration: number;
      };

    const supabase = getServiceClient();

    await step.run("update-status", async () => {
      await supabase.from("videos").update({ status: "scripting" }).eq("id", videoId);
    });

    // Generate script from article content
    const script = await step.run("generate-script", async () => {
      const model = getGeminiFlash();
      const result = await model.generateContent(
        `Convert this article into a ${duration}s video script with [HOOK], scene markers, and [CTA]. Article title: "${title}". Content:\n${content.slice(0, 3000)}\n\nReturn the full script text only.`
      );
      return result.response.text();
    });

    await step.run("update-generating", async () => {
      await supabase.from("videos").update({ status: "generating" }).eq("id", videoId);
    });

    // Generate scenes
    const sceneUrl = await step.run("generate-scene", async () => {
      const result = await routeVideoGeneration({
        prompt: `${title}. Style: ${artStyle}. Professional video about the article topic.`,
        duration: 10,
        aspectRatio,
        style: artStyle,
      });
      return result.videoUrl;
    });

    // Generate voiceover
    const voiceover = await step.run("generate-voiceover", async () => {
      try {
        return await generateFishAudioTTS({
          text: script.replace(/\[.*?\]/g, "").trim().slice(0, 2000),
          voiceId: "default-narrator",
        });
      } catch {
        return null;
      }
    });

    // Assemble
    const assembled = await step.run("assemble", async () => {
      await supabase.from("videos").update({ status: "processing" }).eq("id", videoId);
      return await assembleVideo({
        sceneUrls: [sceneUrl],
        voiceoverUrl: voiceover?.audioUrl,
        aspectRatio,
      });
    });

    // Upload
    const storageUrl = await step.run("upload", async () => {
      const { readFile } = await import("fs/promises");
      const buffer = await readFile(assembled.outputPath);
      const fileName = `${userId}/${videoId}.mp4`;
      await supabase.storage.from("videos").upload(fileName, buffer, {
        contentType: "video/mp4", upsert: true,
      });
      const { data } = supabase.storage.from("videos").getPublicUrl(fileName);
      const { unlink } = await import("fs/promises");
      await unlink(assembled.outputPath).catch(() => {});
      return data.publicUrl;
    });

    // Finalize
    await step.run("finalize", async () => {
      await supabase.from("videos").update({
        status: "completed",
        video_url: storageUrl,
        duration: Math.round(assembled.durationSeconds),
        model_used: "url-to-video",
      }).eq("id", videoId);

      await deductCreditsService(userId, 15, `URL-to-video: ${title}`, videoId);
    });

    return { videoId, status: "completed" };
  }
);
