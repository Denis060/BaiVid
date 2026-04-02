/**
 * Flux.2 via HuggingFace Inference API — primary image generation.
 */

const HF_API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

export async function generateFluxImage(
  prompt: string,
  width: number = 1280,
  height: number = 720
): Promise<Buffer> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HUGGINGFACE_API_KEY not configured");

  const res = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width: Math.min(width, 1280),
        height: Math.min(height, 1280),
        num_inference_steps: 4,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Flux.2 failed (${res.status}): ${await res.text()}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer;
}
