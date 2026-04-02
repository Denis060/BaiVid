/**
 * Flux.2 via HuggingFace Inference API — primary image generation.
 */

const HF_API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

// Flux requires dimensions to be multiples of 8, max 1024
function clampDim(n: number): number {
  return Math.min(Math.floor(n / 8) * 8, 1024);
}

export async function generateFluxImage(
  prompt: string,
  width: number = 1024,
  height: number = 720
): Promise<Buffer> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HUGGINGFACE_API_KEY not configured");

  const w = clampDim(width);
  const h = clampDim(height);

  const res = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width: w,
        height: h,
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
