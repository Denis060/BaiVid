import { inngest } from "@/lib/inngest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const voiceCloneFunction = inngest.createFunction(
  {
    id: "voice-clone",
    retries: 2,
    triggers: [{ event: "voice/clone" }],
  },
  async ({ event, step }) => {
    const { profileId, userId, sampleUrl, name } = event.data as {
      profileId: string;
      userId: string;
      sampleUrl: string;
      name: string;
    };

    const supabase = getServiceClient();

    // Step 1: Download the voice sample
    const sampleBuffer = await step.run("download-sample", async () => {
      const res = await fetch(sampleUrl);
      if (!res.ok) throw new Error("Failed to download voice sample");
      const buffer = await res.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    });

    // Step 2: Clone via Fish Audio API
    const clonedVoiceId = await step.run("clone-voice", async () => {
      const apiKey = process.env.FISH_AUDIO_API_KEY;
      if (!apiKey) throw new Error("FISH_AUDIO_API_KEY not configured");

      // Create a voice model from the sample
      const formData = new FormData();
      formData.append("title", name);
      formData.append("visibility", "private");

      // Convert base64 back to blob for upload
      const audioBuffer = Buffer.from(sampleBuffer, "base64");
      formData.append(
        "voices",
        new Blob([audioBuffer], { type: "audio/webm" }),
        "sample.webm"
      );

      const res = await fetch("https://api.fish.audio/v1/models", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Fish Audio clone failed (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data._id || data.id;
    });

    // Step 3: Update the voice profile with the cloned ID
    await step.run("update-profile", async () => {
      await supabase
        .from("voice_profiles")
        .update({ provider_voice_id: clonedVoiceId })
        .eq("id", profileId);
    });

    return { profileId, voiceId: clonedVoiceId };
  }
);
