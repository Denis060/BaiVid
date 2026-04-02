"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { generateFluxImage } from "@/lib/providers/flux";
import { generateIdeogramImage } from "@/lib/providers/ideogram";
import { deductCredits } from "./credits";
import { randomUUID } from "crypto";

export type ThumbnailStyle = "bold" | "cinematic" | "minimal" | "documentary";

const STYLE_PROMPTS: Record<ThumbnailStyle, string> = {
  bold: "bold vibrant YouTube thumbnail, large dramatic text overlay, high contrast colors, attention-grabbing, professional graphic design",
  cinematic: "cinematic film-quality thumbnail, dramatic lighting, shallow depth of field, moody color grading, professional photography",
  minimal: "minimalist clean thumbnail, simple composition, lots of whitespace, modern design, subtle colors, elegant typography",
  documentary: "documentary-style thumbnail, authentic feel, journalistic photography, realistic, natural lighting, news-quality",
};

interface ThumbnailSize {
  name: string;
  width: number;
  height: number;
}

const SIZES: ThumbnailSize[] = [
  { name: "YouTube", width: 1280, height: 720 },
  { name: "Instagram", width: 1080, height: 1080 },
  { name: "Stories", width: 1080, height: 1920 },
];

export interface GenerateThumbnailsResult {
  thumbnails?: {
    id: string;
    url: string;
    size: string;
    width: number;
    height: number;
  }[];
  error?: string;
}

export async function generateThumbnails(input: {
  title: string;
  style: ThumbnailStyle;
  referenceImageUrl?: string;
  videoId?: string;
}): Promise<GenerateThumbnailsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check credits (1 credit for 3 thumbnails)
  const { data: profile } = await supabase
    .from("users")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits_balance < 1) {
    return { error: "Insufficient credits. You need 1 credit." };
  }

  const stylePrompt = STYLE_PROMPTS[input.style];
  const basePrompt = `${stylePrompt}. Topic: "${input.title}". High resolution, sharp details.`;

  const thumbnails: GenerateThumbnailsResult["thumbnails"] = [];
  let lastError = "";

  // Generate 3 variants (one per size)
  for (const size of SIZES) {
    const prompt = `${basePrompt} Optimized for ${size.name} (${size.width}x${size.height}).`;

    let imageBuffer: Buffer;

    // Try Flux.2 first, fallback to Ideogram
    try {
      imageBuffer = await generateFluxImage(prompt, size.width, size.height);
    } catch (fluxErr) {
      const fluxMsg = fluxErr instanceof Error ? fluxErr.message : String(fluxErr);
      console.error(`Flux.2 failed for ${size.name}:`, fluxMsg);
      try {
        imageBuffer = await generateIdeogramImage(prompt, size.width, size.height);
      } catch (ideoErr) {
        const ideoMsg = ideoErr instanceof Error ? ideoErr.message : String(ideoErr);
        console.error(`Ideogram also failed for ${size.name}:`, ideoMsg);
        // Store last error for user feedback
        lastError = fluxMsg;
        continue;
      }
    }

    // Upload to Supabase Storage (use service role to bypass RLS)
    const storageClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const fileName = `${user.id}/${randomUUID()}.png`;
    const { error: uploadError } = await storageClient.storage
      .from("thumbnails")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Thumbnail upload failed:", uploadError);
      lastError = `Upload failed: ${uploadError.message}`;
      continue;
    }

    const { data: publicUrl } = storageClient.storage
      .from("thumbnails")
      .getPublicUrl(fileName);

    thumbnails.push({
      id: randomUUID(),
      url: publicUrl.publicUrl,
      size: size.name,
      width: size.width,
      height: size.height,
    });
  }

  if (thumbnails.length === 0) {
    const hasFlux = !!process.env.HUGGINGFACE_API_KEY;
    const hasIdeogram = !!process.env.REPLICATE_API_KEY;
    if (!hasFlux && !hasIdeogram) {
      return { error: "No image generation API key configured. Add HUGGINGFACE_API_KEY or REPLICATE_API_KEY." };
    }
    return { error: `Failed to generate thumbnails: ${lastError || "image API error"}. Try again in a minute.` };
  }

  // Deduct 1 credit
  await deductCredits(user.id, 1, "Thumbnail generation", input.videoId);

  return { thumbnails };
}

export async function setVideoThumbnail(videoId: string, thumbnailUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("videos")
    .update({ thumbnail_url: thumbnailUrl })
    .eq("id", videoId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
