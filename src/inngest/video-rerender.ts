import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import { deductCreditsService } from "@/lib/credits-service";
import type { Database } from "@/types/supabase";
import type { EditInstruction, TrimInstruction, TextOverlay, MusicSwap } from "@/lib/editor-types";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { tmpdir } from "os";

const execAsync = promisify(exec);

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const videoRerenderFunction = inngest.createFunction(
  {
    id: "video-rerender",
    retries: 1,
    triggers: [{ event: "video/rerender" }],
  },
  async ({ event, step }) => {
    const { videoId, userId, instructions } = event.data as {
      videoId: string;
      userId: string;
      instructions: EditInstruction[];
    };

    const supabase = getServiceClient();

    // Get video details
    const video = await step.run("load-video", async () => {
      const { data } = await supabase
        .from("videos")
        .select("video_url, duration")
        .eq("id", videoId)
        .single();
      if (!data?.video_url) throw new Error("Video not found");
      return data;
    });

    // Download original video
    const workDir = join(tmpdir(), `rerender-${randomUUID()}`);
    const inputPath = join(workDir, "input.mp4");
    const outputPath = join(workDir, "output.mp4");

    await step.run("download-video", async () => {
      await mkdir(workDir, { recursive: true });
      const res = await fetch(video.video_url!);
      if (!res.ok) throw new Error("Failed to download video");
      const buffer = Buffer.from(await res.arrayBuffer());
      await writeFile(inputPath, buffer);
    });

    // Build and execute FFmpeg command from instructions
    await step.run("rerender", async () => {
      const trim = instructions.find((i): i is TrimInstruction => i.type === "trim");
      const textOverlays = instructions.filter((i): i is TextOverlay => i.type === "text");
      const musicSwap = instructions.find((i): i is MusicSwap => i.type === "music");

      const filters: string[] = [];
      const inputs: string[] = [`-i "${inputPath}"`];

      // Trim
      if (trim) {
        inputs[0] = `-ss ${trim.startTime} -to ${trim.endTime} -i "${inputPath}"`;
      }

      // Music swap
      if (musicSwap?.musicUrl) {
        const musicPath = join(workDir, "music.mp3");
        const musicRes = await fetch(musicSwap.musicUrl);
        if (musicRes.ok) {
          await writeFile(musicPath, Buffer.from(await musicRes.arrayBuffer()));
          inputs.push(`-i "${musicPath}"`);
        }
      }

      // Text overlays
      for (const overlay of textOverlays) {
        const y = overlay.position === "top" ? "50" : overlay.position === "center" ? "(h-text_h)/2" : "h-text_h-50";
        const escapedText = overlay.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
        filters.push(
          `drawtext=text='${escapedText}':fontsize=${overlay.fontSize}:fontcolor=${overlay.fontColor}:x=(w-text_w)/2:y=${y}:enable='between(t,${overlay.startTime},${overlay.endTime})'`
        );
      }

      const vf = filters.length > 0 ? `-vf "${filters.join(",")}"` : "";

      // Audio handling
      let audioFilter = "";
      if (musicSwap?.musicUrl) {
        audioFilter = `-filter_complex "[0:a]volume=0.3[orig];[1:a]volume=${musicSwap.volume}[music];[orig][music]amix=inputs=2:duration=shortest[aout]" -map 0:v -map "[aout]"`;
      }

      const cmd = [
        "ffmpeg -y",
        ...inputs,
        vf,
        audioFilter || "-c:a aac",
        "-c:v libx264 -preset fast -crf 23",
        "-movflags +faststart",
        `"${outputPath}"`,
      ].filter(Boolean).join(" ");

      await execAsync(cmd, { maxBuffer: 100 * 1024 * 1024 });
    });

    // Upload re-rendered video
    const storageUrl = await step.run("upload", async () => {
      const buffer = await readFile(outputPath);
      const fileName = `${userId}/${videoId}_edited.mp4`;

      await supabase.storage.from("videos").upload(fileName, buffer, {
        contentType: "video/mp4",
        upsert: true,
      });

      const { data } = supabase.storage.from("videos").getPublicUrl(fileName);

      // Cleanup
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});

      return data.publicUrl;
    });

    // Update video record + deduct credits
    await step.run("finalize", async () => {
      // Get duration of new video
      let newDuration = video.duration;
      const trim = instructions.find((i): i is TrimInstruction => i.type === "trim");
      if (trim) {
        newDuration = Math.round(trim.endTime - trim.startTime);
      }

      await supabase
        .from("videos")
        .update({
          status: "completed",
          video_url: storageUrl,
          duration: newDuration,
        })
        .eq("id", videoId);

      // Deduct 5 credits
      await deductCreditsService(userId, 5, "Video re-render (editor)", videoId);
    });

    return { videoId, status: "completed" };
  }
);
