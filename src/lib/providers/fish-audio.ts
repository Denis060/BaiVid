/**
 * Fish Audio — Primary TTS provider for voiceover generation.
 */

export interface FishAudioInput {
  text: string;
  voiceId: string;
  speed?: number;
  format?: "mp3" | "wav";
}

export interface FishAudioResult {
  audioUrl: string;
  durationSeconds: number;
}

const FISH_AUDIO_API_URL = "https://api.fish.audio/v1";

/**
 * Generate speech audio from text using Fish Audio.
 */
export async function generateFishAudioTTS(
  input: FishAudioInput
): Promise<FishAudioResult> {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) throw new Error("FISH_AUDIO_API_KEY not configured");

  const res = await fetch(`${FISH_AUDIO_API_URL}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      text: input.text,
      reference_id: input.voiceId,
      format: input.format || "mp3",
      speed: input.speed || 1.0,
    }),
  });

  if (!res.ok) {
    throw new Error(`Fish Audio TTS failed: ${res.status}`);
  }

  // Fish Audio returns audio binary directly
  const audioBuffer = Buffer.from(await res.arrayBuffer());

  // Estimate duration from file size (rough: mp3 ~16KB/s at 128kbps)
  const estimatedDuration = Math.round(audioBuffer.length / 16000);

  // Upload to Supabase Storage temp bucket
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ext = input.format === "wav" ? "wav" : "mp3";
  const fileName = `voiceover_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("voice_samples")
    .upload(fileName, audioBuffer, {
      contentType: input.format === "wav" ? "audio/wav" : "audio/mpeg",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload voiceover: ${uploadError.message}`);
  }

  const { data: publicUrl } = supabase.storage
    .from("voice_samples")
    .getPublicUrl(fileName);

  return { audioUrl: publicUrl.publicUrl, durationSeconds: estimatedDuration };
}

/**
 * List available Fish Audio voice models.
 */
export async function listFishAudioVoices() {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(`${FISH_AUDIO_API_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.items || data.models || [];
  } catch {
    return [];
  }
}

/** Default voice presets when API is not available */
export const FISH_AUDIO_PRESETS = [
  { id: "default-male-1", name: "Professional Male", language: "en" },
  { id: "default-female-1", name: "Professional Female", language: "en" },
  { id: "default-male-2", name: "Energetic Male", language: "en" },
  { id: "default-female-2", name: "Friendly Female", language: "en" },
  { id: "default-narrator", name: "Documentary Narrator", language: "en" },
] as const;
