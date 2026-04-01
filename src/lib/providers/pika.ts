/**
 * Pika 2.5 — Budget AI video generation fallback.
 */

export interface PikaGenerateInput {
  prompt: string;
  duration: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
}

export interface PikaGenerateResult {
  videoUrl: string;
  generationId: string;
}

const PIKA_API_URL = "https://api.pika.art/v1";

export async function generatePikaVideo(
  input: PikaGenerateInput
): Promise<PikaGenerateResult> {
  const apiKey = process.env.PIKA_API_KEY;
  if (!apiKey) throw new Error("PIKA_API_KEY not configured");

  const res = await fetch(`${PIKA_API_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: input.prompt,
      duration: Math.min(input.duration, 8),
      aspect_ratio: input.aspectRatio,
      model: "pika-2.5",
    }),
  });

  if (!res.ok) throw new Error(`Pika failed: ${res.status}`);

  const data = await res.json();
  const generationId = data.id || data.generation_id;
  if (!generationId) throw new Error("No generation_id from Pika");

  // Poll for result
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollRes = await fetch(`${PIKA_API_URL}/generate/${generationId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!pollRes.ok) continue;
    const pollData = await pollRes.json();

    if (pollData.status === "completed" && pollData.video_url) {
      return { videoUrl: pollData.video_url, generationId };
    }
    if (pollData.status === "failed") {
      throw new Error("Pika generation failed");
    }
  }

  throw new Error("Pika timed out");
}
