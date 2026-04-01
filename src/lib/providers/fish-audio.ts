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
  const audioBuffer = await res.arrayBuffer();
  const audioBlob = new Blob([audioBuffer], {
    type: input.format === "wav" ? "audio/wav" : "audio/mpeg",
  });

  // Estimate duration from file size (rough: mp3 ~16KB/s at 128kbps)
  const estimatedDuration = Math.round(audioBlob.size / 16000);

  // In production, upload to temp storage and return URL
  // For now, return a data URL or upload to Supabase
  const base64 = Buffer.from(audioBuffer).toString("base64");
  const mimeType = input.format === "wav" ? "audio/wav" : "audio/mpeg";
  const audioUrl = `data:${mimeType};base64,${base64}`;

  return { audioUrl, durationSeconds: estimatedDuration };
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
