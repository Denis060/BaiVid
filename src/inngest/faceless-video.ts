import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { routeVideoGeneration } from "@/lib/providers/video-router";
import { generateFishAudioTTS } from "@/lib/providers/fish-audio";
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
    duration: number; // target seconds
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
          });
          results.push({ url: result.videoUrl, provider: result.provider });
        } catch (err) {
          console.error(`Scene generation failed:`, err);
          // Push empty — will be handled in assembly
          results.push({ url: "", provider: "failed" });
        }
      }

      return results;
    });

    // Step 3: Generate voiceover
    const voiceover = await step.run("generate-voiceover", async () => {
      try {
        const fullNarration = scenes.map((s) => s.narration).join(" ");
        const result = await generateFishAudioTTS({
          text: fullNarration,
          voiceId,
        });
        return result;
      } catch (err) {
        console.error("Voiceover generation failed:", err);
        return null;
      }
    });

    // Step 4: Generate captions from narration
    const captions = await step.run("generate-captions", async () => {
      return generateCaptionsFromScenes(scenes);
    });

    // Step 5: Assemble final video
    const assembled = await step.run("assemble-video", async () => {
      const validSceneUrls = sceneResults
        .filter((r) => r.url && r.provider !== "failed")
        .map((r) => r.url);

      if (validSceneUrls.length === 0) {
        throw new Error("No scenes generated successfully");
      }

      await supabase
        .from("videos")
        .update({ status: "processing" })
        .eq("id", videoId);

      return await assembleVideo({
        sceneUrls: validSceneUrls,
        voiceoverUrl: voiceover?.audioUrl,
        captions,
        aspectRatio,
      });
    });

    // Step 6: Upload to Supabase Storage
    const storageResult = await step.run("upload-to-storage", async () => {
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

      // Clean up temp file
      const { unlink } = await import("fs/promises");
      await unlink(assembled.outputPath).catch(() => {});

      return publicUrl.publicUrl;
    });

    // Step 7: Determine which provider was used
    const modelUsed = sceneResults.find((r) => r.provider !== "failed")?.provider || "unknown";

    // Step 8: Update video record
    await step.run("update-video-record", async () => {
      await supabase
        .from("videos")
        .update({
          status: "completed",
          video_url: storageResult,
          duration: Math.round(assembled.durationSeconds),
          model_used: modelUsed,
          art_style: artStyle,
          aspect_ratio: aspectRatio,
        })
        .eq("id", videoId);
    });

    // Step 9: Deduct credits
    await step.run("deduct-credits", async () => {
      const durationMinutes = Math.max(1, Math.ceil(duration / 60));
      const creditCost = 15 * durationMinutes;

      // Update balance
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
          description: `Faceless video (${durationMinutes}min, ${modelUsed})`,
          reference_id: videoId,
          balance_after: newBalance,
        });
      }
    });

    return { videoId, status: "completed", modelUsed };
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
  // Split by scene markers or paragraphs
  const blocks = script
    .split(/\[SCENE \d+[^\]]*\]|\[HOOK\]|\[CTA\]|\n\n+/)
    .map((b) => b.trim())
    .filter((b) => b.length > 10);

  if (blocks.length === 0) {
    // Fallback: split by sentences
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
    // Check for visual direction markers
    const visualMatch = block.match(/(?:📹|Visual:|visual_direction:)\s*(.+)/i);
    const narration = block
      .replace(/(?:📹|Visual:|visual_direction:)\s*.+/gi, "")
      .trim();

    return {
      narration,
      visualPrompt: visualMatch?.[1] || extractVisualPrompt(narration),
      duration: Math.min(sceneDuration, 10), // Max 10s per AI clip
    };
  });
}

function extractVisualPrompt(narration: string): string {
  // Extract key nouns/actions for visual prompt
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
    // Split narration into caption chunks (~8 words each)
    const words = scene.narration.split(/\s+/);
    const chunkSize = 8;
    const wordsPerSecond = words.length / scene.duration;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      const chunkDuration = Math.min(
        chunk.split(/\s+/).length / wordsPerSecond,
        4 // Max 4 seconds per caption
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
