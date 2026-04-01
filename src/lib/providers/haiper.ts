/**
 * Haiper — Fallback AI video generation provider.
 */

export interface HaiperGenerateInput {
  prompt: string;
  duration: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
}

export interface HaiperGenerateResult {
  videoUrl: string;
  jobId: string;
}

const HAIPER_API_URL = "https://api.haiper.ai/v1";

export async function generateHaiperVideo(
  input: HaiperGenerateInput
): Promise<HaiperGenerateResult> {
  const apiKey = process.env.HAIPER_API_KEY;
  if (!apiKey) throw new Error("HAIPER_API_KEY not configured");

  const res = await fetch(`${HAIPER_API_URL}/video/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: input.prompt,
      duration: Math.min(input.duration, 8),
      aspect_ratio: input.aspectRatio,
    }),
  });

  if (!res.ok) throw new Error(`Haiper failed: ${res.status}`);

  const data = await res.json();
  const jobId = data.job_id || data.id;
  if (!jobId) throw new Error("No job_id from Haiper");

  // Poll for result
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(`${HAIPER_API_URL}/video/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!pollRes.ok) continue;
    const pollData = await pollRes.json();

    if (pollData.status === "completed" && pollData.video_url) {
      return { videoUrl: pollData.video_url, jobId };
    }
    if (pollData.status === "failed") {
      throw new Error("Haiper generation failed");
    }
  }

  throw new Error("Haiper timed out");
}
