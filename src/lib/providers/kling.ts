/**
 * Kling AI 3.0 — Primary AI video generation provider.
 * Generates video clips from text/image prompts.
 */

export interface KlingGenerateInput {
  prompt: string;
  duration: number; // seconds per clip
  aspectRatio: "16:9" | "9:16" | "1:1";
  style?: string;
}

export interface KlingGenerateResult {
  videoUrl: string;
  taskId: string;
}

const KLING_API_URL = "https://api.klingai.com/v1";

export async function generateKlingVideo(
  input: KlingGenerateInput
): Promise<KlingGenerateResult> {
  const apiKey = process.env.KLING_API_KEY;
  if (!apiKey) throw new Error("KLING_API_KEY not configured");

  // Create generation task
  const createRes = await fetch(`${KLING_API_URL}/videos/text2video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: input.prompt,
      duration: Math.min(input.duration, 10), // Kling max 10s per clip
      aspect_ratio: input.aspectRatio,
      model: "kling-v3",
      style: input.style || "cinematic",
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Kling create failed: ${createRes.status}`);
  }

  const createData = await createRes.json();
  const taskId = createData.data?.task_id;
  if (!taskId) throw new Error("No task_id from Kling");

  // Poll for completion (max 5 minutes)
  const videoUrl = await pollKlingTask(taskId, apiKey);
  return { videoUrl, taskId };
}

async function pollKlingTask(
  taskId: string,
  apiKey: string,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await fetch(`${KLING_API_URL}/videos/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) continue;

    const data = await res.json();
    const status = data.data?.status;

    if (status === "completed" || status === "succeed") {
      const url = data.data?.video_url || data.data?.output?.video_url;
      if (url) return url;
    }

    if (status === "failed") {
      throw new Error(`Kling task failed: ${data.data?.error || "unknown"}`);
    }
  }

  throw new Error("Kling task timed out");
}
