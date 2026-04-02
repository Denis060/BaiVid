/**
 * Ideogram v3 via Replicate — fallback image generation with excellent text rendering.
 */

const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

export async function generateIdeogramImage(
  prompt: string,
  width: number = 1280,
  height: number = 720
): Promise<Buffer> {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) throw new Error("REPLICATE_API_KEY not configured");

  // Create prediction
  const createRes = await fetch(REPLICATE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "ideogram-ai/ideogram-v3",
      input: {
        prompt,
        width,
        height,
        rendering_quality: "STANDARD",
      },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Ideogram create failed (${createRes.status})`);
  }

  const prediction = await createRes.json();
  const predictionUrl = prediction.urls?.get || `${REPLICATE_API_URL}/${prediction.id}`;

  // Poll for completion
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const pollRes = await fetch(predictionUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!pollRes.ok) continue;
    const pollData = await pollRes.json();

    if (pollData.status === "succeeded" && pollData.output) {
      const imageUrl = Array.isArray(pollData.output)
        ? pollData.output[0]
        : pollData.output;
      const imgRes = await fetch(imageUrl);
      return Buffer.from(await imgRes.arrayBuffer());
    }

    if (pollData.status === "failed") {
      throw new Error("Ideogram generation failed");
    }
  }

  throw new Error("Ideogram timed out");
}
