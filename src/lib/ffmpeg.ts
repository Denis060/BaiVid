/**
 * Server-side video assembly wrapper.
 * Primary: Shotstack cloud API (for Vercel deployment)
 * Fallback: Local FFmpeg (for development/self-hosted)
 * Handles: concatenation, voiceover overlay, caption burn-in, music mixing.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { assembleVideoCloud, isShotstackConfigured } from "./shotstack";

const execAsync = promisify(exec);

export interface AssembleVideoInput {
  sceneUrls: string[];
  voiceoverUrl?: string;
  musicUrl?: string;
  captions?: CaptionEntry[];
  aspectRatio: "16:9" | "9:16" | "1:1";
  outputFormat?: "mp4" | "webm";
}

export interface CaptionEntry {
  startTime: number; // seconds
  endTime: number;
  text: string;
}

export interface AssembleVideoResult {
  outputPath: string;
  durationSeconds: number;
  fileSizeBytes: number;
}

const RESOLUTIONS: Record<string, string> = {
  "16:9": "1920:1080",
  "9:16": "1080:1920",
  "1:1": "1080:1080",
};

/**
 * Assemble a final video from scenes, voiceover, captions, and music.
 * Tries Shotstack cloud API first (Vercel-compatible), falls back to FFmpeg.
 */
export async function assembleVideo(
  input: AssembleVideoInput
): Promise<AssembleVideoResult> {
  // Try Shotstack first if configured
  if (isShotstackConfigured()) {
    try {
      console.log("[Video Assembly] Attempting Shotstack cloud API...");
      const result = await assembleVideoCloud(input);
      console.log("[Video Assembly] SUCCESS: Used Shotstack cloud API");
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Video Assembly] Shotstack failed, falling back to FFmpeg: ${errorMsg}`);
    }
  } else {
    console.log("[Video Assembly] Shotstack not configured, using FFmpeg");
  }

  // Fallback to local FFmpeg
  return assembleVideoLocal(input);
}

/**
 * Local FFmpeg-based assembly (fallback when Shotstack unavailable).
 */
async function assembleVideoLocal(
  input: AssembleVideoInput
): Promise<AssembleVideoResult> {
  const workDir = join(tmpdir(), `baivid-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  const resolution = RESOLUTIONS[input.aspectRatio] || "1920:1080";
  const outputPath = join(workDir, `output.${input.outputFormat || "mp4"}`);

  try {
    // 1. Download all scene files
    const scenePaths: string[] = [];
    for (let i = 0; i < input.sceneUrls.length; i++) {
      const scenePath = join(workDir, `scene_${i}.mp4`);
      await downloadFile(input.sceneUrls[i], scenePath);
      scenePaths.push(scenePath);
    }

    // 2. Create concat file
    const concatPath = join(workDir, "concat.txt");
    const concatContent = scenePaths
      .map((p) => `file '${p.replace(/\\/g, "/")}'`)
      .join("\n");
    await writeFile(concatPath, concatContent);

    // 3. Download voiceover if provided
    let voiceoverPath: string | undefined;
    if (input.voiceoverUrl && !input.voiceoverUrl.startsWith("data:")) {
      voiceoverPath = join(workDir, "voiceover.mp3");
      await downloadFile(input.voiceoverUrl, voiceoverPath);
    }

    // 4. Download music if provided
    let musicPath: string | undefined;
    if (input.musicUrl) {
      musicPath = join(workDir, "music.mp3");
      await downloadFile(input.musicUrl, musicPath);
    }

    // 5. Generate SRT captions file
    let srtPath: string | undefined;
    if (input.captions && input.captions.length > 0) {
      srtPath = join(workDir, "captions.srt");
      const srtContent = generateSRT(input.captions);
      await writeFile(srtPath, srtContent);
    }

    // 6. Build FFmpeg command
    const cmd = buildFFmpegCommand({
      concatPath,
      voiceoverPath,
      musicPath,
      srtPath,
      resolution,
      outputPath,
    });

    await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });

    // Get output file info
    const { stdout: probeOut } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format "${outputPath}"`
    );
    const probeData = JSON.parse(probeOut);
    const durationSeconds = parseFloat(probeData.format?.duration || "0");
    const fileSizeBytes = parseInt(probeData.format?.size || "0", 10);

    return { outputPath, durationSeconds, fileSizeBytes };
  } catch (err) {
    // Clean up on failure
    await cleanup(workDir);
    throw err;
  }
}

function buildFFmpegCommand(opts: {
  concatPath: string;
  voiceoverPath?: string;
  musicPath?: string;
  srtPath?: string;
  resolution: string;
  outputPath: string;
}): string {
  const inputs: string[] = [
    `-f concat -safe 0 -i "${opts.concatPath}"`,
  ];

  if (opts.voiceoverPath) {
    inputs.push(`-i "${opts.voiceoverPath}"`);
  }
  if (opts.musicPath) {
    inputs.push(`-i "${opts.musicPath}"`);
  }

  // Video filter: scale + pad to target resolution
  let vf = `scale=${opts.resolution}:force_original_aspect_ratio=decrease,pad=${opts.resolution}:(ow-iw)/2:(oh-ih)/2:color=black`;

  // Burn in captions if SRT exists
  if (opts.srtPath) {
    const srtEscaped = opts.srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");
    vf += `,subtitles='${srtEscaped}':force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2'`;
  }

  // Audio mixing
  let audioFilter = "";
  const audioInputs: number[] = [];

  if (opts.voiceoverPath) audioInputs.push(1);
  if (opts.musicPath)
    audioInputs.push(opts.voiceoverPath ? 2 : 1);

  if (audioInputs.length === 2) {
    // Mix voiceover (full volume) + music (30% volume)
    audioFilter = `-filter_complex "[${audioInputs[0]}:a]volume=1.0[vo];[${audioInputs[1]}:a]volume=0.3[mu];[vo][mu]amix=inputs=2:duration=longest[aout]" -map 0:v -map "[aout]"`;
  } else if (audioInputs.length === 1) {
    audioFilter = `-map 0:v -map ${audioInputs[0]}:a`;
  } else {
    audioFilter = "-map 0:v -an";
  }

  return [
    "ffmpeg -y",
    ...inputs,
    `-vf "${vf}"`,
    audioFilter,
    "-c:v libx264 -preset fast -crf 23",
    "-c:a aac -b:a 192k",
    "-movflags +faststart",
    `"${opts.outputPath}"`,
  ].join(" ");
}

function generateSRT(captions: CaptionEntry[]): string {
  return captions
    .map((c, i) => {
      const start = formatSRTTime(c.startTime);
      const end = formatSRTTime(c.endTime);
      return `${i + 1}\n${start} --> ${end}\n${c.text}\n`;
    })
    .join("\n");
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad3(ms)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${url} (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buffer);
}

async function cleanup(dir: string): Promise<void> {
  try {
    const { readdir } = await import("fs/promises");
    const files = await readdir(dir);
    for (const file of files) {
      await unlink(join(dir, file)).catch(() => {});
    }
    const { rmdir } = await import("fs/promises");
    await rmdir(dir).catch(() => {});
  } catch {
    // Ignore cleanup errors
  }
}
