/**
 * Google Cloud Text-to-Speech provider — Neural2 voices with 1M chars/month free quota.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export interface GoogleTTSInput {
  text: string;
  voiceId: string; // maps to a GOOGLE_TTS_VOICES entry
  speed?: number; // maps to speakingRate (0.25-4.0, default 1.0)
}

export interface GoogleTTSResult {
  audioUrl: string; // Supabase Storage public URL
  durationSeconds: number;
}

export interface GoogleTTSVoice {
  id: string; // baivid internal ID like "google-en-male-1"
  googleName: string; // Google API name like "en-US-Neural2-D"
  languageCode: string; // "en-US", "yo-NG", etc.
  name: string; // Display name: "American Male (Neural)"
  gender: "MALE" | "FEMALE";
  language: string; // Display: "English", "Yoruba", etc.
  tier: "standard" | "neural2" | "wavenet"; // quality tier
  flag: string; // emoji flag for UI display
}

const GOOGLE_TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

/**
 * Complete Google TTS voice registry with support for English, African, French, and Arabic.
 */
export const GOOGLE_TTS_VOICES: GoogleTTSVoice[] = [
  // English voices
  {
    id: "google-en-male-1",
    googleName: "en-US-Neural2-D",
    languageCode: "en-US",
    name: "American Male",
    gender: "MALE",
    language: "English",
    tier: "neural2",
    flag: "🇺🇸",
  },
  {
    id: "google-en-female-1",
    googleName: "en-US-Neural2-F",
    languageCode: "en-US",
    name: "American Female",
    gender: "FEMALE",
    language: "English",
    tier: "neural2",
    flag: "🇺🇸",
  },
  {
    id: "google-en-male-2",
    googleName: "en-US-Neural2-J",
    languageCode: "en-US",
    name: "American Male (Deep)",
    gender: "MALE",
    language: "English",
    tier: "neural2",
    flag: "🇺🇸",
  },
  {
    id: "google-en-gb-male",
    googleName: "en-GB-Neural2-B",
    languageCode: "en-GB",
    name: "British Male",
    gender: "MALE",
    language: "English",
    tier: "neural2",
    flag: "🇬🇧",
  },
  {
    id: "google-en-gb-female",
    googleName: "en-GB-Neural2-C",
    languageCode: "en-GB",
    name: "British Female",
    gender: "FEMALE",
    language: "English",
    tier: "neural2",
    flag: "🇬🇧",
  },
  // African voices
  {
    id: "google-yo-female",
    googleName: "yo-NG-Standard-A",
    languageCode: "yo-NG",
    name: "Yoruba Female",
    gender: "FEMALE",
    language: "Yoruba",
    tier: "standard",
    flag: "🇳🇬",
  },
  {
    id: "google-sw-female",
    googleName: "sw-TZ-Standard-A",
    languageCode: "sw-TZ",
    name: "Swahili Female",
    gender: "FEMALE",
    language: "Swahili",
    tier: "standard",
    flag: "🇹🇿",
  },
  {
    id: "google-af-female",
    googleName: "af-ZA-Standard-A",
    languageCode: "af-ZA",
    name: "Afrikaans Female",
    gender: "FEMALE",
    language: "Afrikaans",
    tier: "standard",
    flag: "🇿🇦",
  },
  // French voices
  {
    id: "google-fr-male",
    googleName: "fr-FR-Neural2-B",
    languageCode: "fr-FR",
    name: "French Male",
    gender: "MALE",
    language: "French",
    tier: "neural2",
    flag: "🇫🇷",
  },
  {
    id: "google-fr-female",
    googleName: "fr-FR-Neural2-C",
    languageCode: "fr-FR",
    name: "French Female",
    gender: "FEMALE",
    language: "French",
    tier: "neural2",
    flag: "🇫🇷",
  },
  // Arabic voices
  {
    id: "google-ar-male",
    googleName: "ar-XA-Neural2-B",
    languageCode: "ar-XA",
    name: "Arabic Male",
    gender: "MALE",
    language: "Arabic",
    tier: "neural2",
    flag: "🇸🇦",
  },
  {
    id: "google-ar-female",
    googleName: "ar-XA-Neural2-C",
    languageCode: "ar-XA",
    name: "Arabic Female",
    gender: "FEMALE",
    language: "Arabic",
    tier: "neural2",
    flag: "🇸🇦",
  },
];

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Generate speech and upload to Supabase Storage.
 */
export async function generateGoogleTTS(
  input: GoogleTTSInput
): Promise<GoogleTTSResult> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_TTS_API_KEY not configured");

  // Look up voice from registry
  const voice = GOOGLE_TTS_VOICES.find((v) => v.id === input.voiceId);
  if (!voice) {
    throw new Error(`Unknown voice: ${input.voiceId}`);
  }

  // Prepare request
  const speed = Math.max(0.25, Math.min(4.0, input.speed || 1.0));

  const requestBody = {
    input: { text: input.text },
    voice: {
      languageCode: voice.languageCode,
      name: voice.googleName,
      ssmlGender: voice.gender,
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: speed,
      pitch: 0.0,
    },
  };

  // Call Google TTS API
  const res = await fetch(`${GOOGLE_TTS_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Google TTS API failed: ${res.status} - ${errorData}`);
  }

  const { audioContent } = (await res.json()) as { audioContent: string };
  if (!audioContent) {
    throw new Error("No audio content in Google TTS response");
  }

  // Decode base64 to buffer
  const audioBuffer = Buffer.from(audioContent, "base64");

  // Estimate duration from file size (~16KB/s at 128kbps MP3)
  const estimatedDuration = Math.round(audioBuffer.length / 16000);

  // Upload to Supabase Storage
  const supabase = getServiceClient();
  const fileName = `voiceover_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`;

  const { error: uploadError } = await supabase.storage
    .from("voice_samples")
    .upload(fileName, audioBuffer, {
      contentType: "audio/mpeg",
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
 * Check monthly character usage against 1M limit.
 */
export async function getGoogleTTSMonthlyUsage(): Promise<number> {
  const supabase = getServiceClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString();

  try {
    const { data, error } = await supabase
      .from("credits_transactions")
      .select("description")
      .ilike("description", "%[COST] tts:google-tts-%")
      .gte("created_at", monthStart);

    if (error) {
      console.error("Failed to query usage:", error);
      return 0;
    }

    // Parse character counts from description field
    // Pattern: "[COST] tts:google-tts-* chars:12345"
    let totalChars = 0;
    (data || []).forEach((row) => {
      const match = row.description?.match(/chars:(\d+)/);
      if (match) {
        totalChars += parseInt(match[1], 10);
      }
    });

    return totalChars;
  } catch (err) {
    console.error("Error calculating Google TTS monthly usage:", err);
    return 0;
  }
}

/**
 * Check if Google TTS is available (API key exists and monthly limit not exceeded).
 */
export async function isGoogleTTSAvailable(charCount: number): Promise<boolean> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return false;

  const monthlyUsage = await getGoogleTTSMonthlyUsage();
  // Leave 100K buffer from the 1M limit
  return monthlyUsage + charCount < 900000;
}
