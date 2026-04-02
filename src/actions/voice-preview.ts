"use server";

/**
 * Generate a short voice preview using Google TTS.
 * Returns a base64 audio data URL for instant playback.
 */
export async function generateVoicePreview(voiceId: string): Promise<{ audioUrl: string } | { error: string }> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;

  // Map voice IDs to Google TTS config
  const voiceMap: Record<string, { languageCode: string; name: string }> = {
    "google-en-male-1": { languageCode: "en-US", name: "en-US-Neural2-D" },
    "google-en-male-2": { languageCode: "en-US", name: "en-US-Neural2-J" },
    "google-en-female-1": { languageCode: "en-US", name: "en-US-Neural2-C" },
    "google-en-female-2": { languageCode: "en-US", name: "en-US-Neural2-F" },
    "google-en-gb-male": { languageCode: "en-GB", name: "en-GB-Neural2-B" },
    "google-en-gb-female": { languageCode: "en-GB", name: "en-GB-Neural2-A" },
    "google-fr-male": { languageCode: "fr-FR", name: "fr-FR-Neural2-B" },
    "google-fr-female": { languageCode: "fr-FR", name: "fr-FR-Neural2-A" },
    "google-ar-male": { languageCode: "ar-XA", name: "ar-XA-Standard-B" },
    "google-ar-female": { languageCode: "ar-XA", name: "ar-XA-Standard-A" },
    "google-yo-male": { languageCode: "yo-NG", name: "yo-NG-Standard-A" },
    "google-sw-female": { languageCode: "sw-TZ", name: "sw-TZ-Standard-A" },
    "google-af-male": { languageCode: "af-ZA", name: "af-ZA-Standard-A" },
  };

  const voiceConfig = voiceMap[voiceId];

  if (apiKey && voiceConfig) {
    try {
      const res = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: "Welcome to Baivid. This is how your video narration will sound." },
            voice: {
              languageCode: voiceConfig.languageCode,
              name: voiceConfig.name,
            },
            audioConfig: { audioEncoding: "MP3" },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        return { audioUrl: `data:audio/mpeg;base64,${data.audioContent}` };
      }
    } catch (err) {
      console.error("Voice preview failed:", err);
    }
  }

  // Fallback: no preview available
  return { error: "Preview not available for this voice" };
}
