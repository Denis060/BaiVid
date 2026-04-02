/**
 * Shotstack cloud API integration for video assembly.
 * Replaces FFmpeg for Vercel deployment (FFmpeg unavailable in serverless).
 * Handles: concatenation, voiceover overlay, caption overlays, music mixing.
 */

import { randomUUID } from "crypto";

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
  videoUrl?: string;
  durationSeconds: number;
  fileSizeBytes: number;
}

interface ShotstackTimeline {
  tracks: ShotstackTrack[];
}

interface ShotstackTrack {
  clips: ShotstackClip[];
}

interface ShotstackClip {
  asset: ShotstackAsset;
  start: number;
  length: number;
  effect?: {
    type: string;
    [key: string]: unknown;
  };
}

interface ShotstackAsset {
  type: "video" | "audio" | "html";
  src?: string;
  html?: string;
  [key: string]: unknown;
}

interface ShotstackRenderRequest {
  timeline: ShotstackTimeline;
  output: {
    format: string;
    resolution: string;
    size: {
      width: number;
      height: number;
    };
  };
}

interface ShotstackRenderResponse {
  success: boolean;
  response: {
    id: string;
    owner: string;
    plan: string;
    status: string;
    duration?: number;
    filesize?: number;
    url?: string;
  };
}

interface ShotstackStatusResponse {
  success: boolean;
  response: {
    id: string;
    owner: string;
    plan: string;
    status: "queued" | "rendering" | "done" | "failed";
    duration?: number;
    filesize?: number;
    url?: string;
    error?: string;
  };
}

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
const SHOTSTACK_API_BASE = process.env.SHOTSTACK_API_ENV === "production"
  ? "https://api.shotstack.io/v1"
  : "https://api.shotstack.io/stage";

const RESOLUTIONS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
};

const POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_POLL_ATTEMPTS = 120; // 10 minutes total

/**
 * Assemble video using Shotstack cloud API.
 * Concatenates scenes, overlays voiceover and music, adds captions.
 */
export async function assembleVideoCloud(
  input: AssembleVideoInput
): Promise<AssembleVideoResult> {
  if (!SHOTSTACK_API_KEY) {
    throw new Error("SHOTSTACK_API_KEY environment variable not set");
  }

  try {
    const resolution = RESOLUTIONS[input.aspectRatio] || RESOLUTIONS["16:9"];

    // Build timeline with video, voiceover, music, and caption tracks
    const timeline = buildTimeline(input, resolution);

    // Submit render request
    const renderId = await submitRender(timeline, resolution, input.outputFormat || "mp4");
    console.log(`[Shotstack] Render job submitted: ${renderId}`);

    // Poll for completion
    const result = await pollRenderCompletion(renderId);
    console.log(`[Shotstack] Render completed: ${result.id}, URL: ${result.url}`);

    return {
      outputPath: result.url || "",
      videoUrl: result.url,
      durationSeconds: result.duration || 0,
      fileSizeBytes: result.filesize || 0,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Shotstack] Assembly failed: ${errorMsg}`);
    throw err;
  }
}

/**
 * Build Shotstack timeline with video, audio, and caption tracks.
 */
function buildTimeline(
  input: AssembleVideoInput,
  resolution: { width: number; height: number }
): ShotstackTimeline {
  const tracks: ShotstackTrack[] = [];

  // Shotstack tracks: index 0 = TOP layer, last = BOTTOM layer
  // So captions must be FIRST (on top), video LAST (on bottom)

  // Track 0 (top layer): Caption overlays
  if (input.captions && input.captions.length > 0) {
    const captionClips = buildCaptionTrack(input.captions, resolution);
    if (captionClips.length > 0) {
      tracks.push({ clips: captionClips });
    }
  }

  // Track 1: Voiceover audio
  if (input.voiceoverUrl) {
    const videoClips = buildVideoTrack(input.sceneUrls, resolution);
    const voiceoverClips = buildAudioTrack(input.voiceoverUrl, videoClips);
    tracks.push({ clips: voiceoverClips });
  }

  // Track 2: Background music at 30% volume
  if (input.musicUrl) {
    const videoClips = buildVideoTrack(input.sceneUrls, resolution);
    const musicClips = buildAudioTrack(input.musicUrl, videoClips, 0.3);
    tracks.push({ clips: musicClips });
  }

  // Track 3 (bottom layer): Video track
  const videoClips = buildVideoTrack(input.sceneUrls, resolution);
  tracks.push({ clips: videoClips });

  return { tracks };
}

/**
 * Build video track with all scene clips concatenated.
 */
function buildVideoTrack(
  sceneUrls: string[],
  resolution: { width: number; height: number }
): ShotstackClip[] {
  let currentTime = 0;

  return sceneUrls.map((url) => {
    // Estimate clip length (we'll assume ~5 seconds per scene as default)
    // Shotstack will handle the actual video duration
    const clipLength = 5;

    const clip: ShotstackClip = {
      asset: {
        type: "video",
        src: url,
      },
      start: currentTime,
      length: clipLength,
    };

    currentTime += clipLength;
    return clip;
  });
}

/**
 * Build audio track for voiceover or music.
 */
function buildAudioTrack(
  audioUrl: string,
  videoClips: ShotstackClip[],
  volume?: number
): ShotstackClip[] {
  // Calculate total video duration
  const totalDuration = videoClips.reduce((sum, clip) => sum + clip.length, 0);

  const clip: ShotstackClip = {
    asset: {
      type: "audio",
      src: audioUrl,
    },
    start: 0,
    length: totalDuration,
  };

  // Add volume adjustment if specified (for music at 30%)
  if (volume !== undefined && volume !== 1.0) {
    clip.effect = {
      type: "volume",
      amount: volume,
    };
  }

  return [clip];
}

/**
 * Build caption overlay track.
 * Generates HTML-based captions positioned at center-bottom of video.
 */
function buildCaptionTrack(
  captions: CaptionEntry[],
  resolution: { width: number; height: number }
): ShotstackClip[] {
  return captions.map((caption) => {
    const html = generateCaptionHTML(caption.text, resolution);

    const clip: ShotstackClip = {
      asset: {
        type: "html",
        html,
      },
      start: caption.startTime,
      length: caption.endTime - caption.startTime,
    };

    return clip;
  });
}

/**
 * Generate HTML for caption overlay.
 * Creates styled text positioned at bottom-center of video.
 */
function generateCaptionHTML(
  text: string,
  resolution: { width: number; height: number }
): string {
  // Escape HTML to prevent injection
  const safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      font-family: Arial, sans-serif;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .caption {
      background: rgba(0, 0, 0, 0.8);
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 24px;
      line-height: 1.4;
      max-width: 90%;
      text-align: center;
      margin-bottom: 40px;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <div class="caption">${safeText}</div>
</body>
</html>`;
}

/**
 * Submit render request to Shotstack API.
 */
async function submitRender(
  timeline: ShotstackTimeline,
  resolution: { width: number; height: number },
  format: string
): Promise<string> {
  const payload: ShotstackRenderRequest = {
    timeline,
    output: {
      format,
      resolution: "hd", // High definition
      size: resolution,
    },
  };

  const response = await fetch(`${SHOTSTACK_API_BASE}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": SHOTSTACK_API_KEY!,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Shotstack API error (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as ShotstackRenderResponse;

  if (!data.success) {
    throw new Error(`Shotstack render submission failed: ${JSON.stringify(data)}`);
  }

  return data.response.id;
}

/**
 * Poll Shotstack API for render job completion.
 */
async function pollRenderCompletion(
  renderId: string
): Promise<ShotstackStatusResponse["response"]> {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    const response = await fetch(`${SHOTSTACK_API_BASE}/render/${renderId}`, {
      headers: {
        "x-api-key": SHOTSTACK_API_KEY!,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Shotstack status check failed (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as ShotstackStatusResponse;

    if (!data.success) {
      throw new Error(`Shotstack status check failed: ${JSON.stringify(data)}`);
    }

    const status = data.response.status;
    console.log(`[Shotstack] Render ${renderId} status: ${status}`);

    if (status === "done") {
      return data.response;
    }

    if (status === "failed") {
      throw new Error(
        `Shotstack render failed: ${data.response.error || "Unknown error"}`
      );
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    attempts++;
  }

  throw new Error(
    `Shotstack render timeout after ${MAX_POLL_ATTEMPTS} attempts (${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s)`
  );
}

/**
 * Check if Shotstack is available and configured.
 */
export function isShotstackConfigured(): boolean {
  return !!SHOTSTACK_API_KEY;
}
