/**
 * D-ID API client — talking avatar video generation with lip-sync.
 */

const DID_API_URL = "https://api.d-id.com";

function getHeaders() {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) throw new Error("DID_API_KEY not configured");
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${apiKey}`,
  };
}

/**
 * Create a D-ID actor from a photo and optional voice sample.
 * Returns the actor_id for reuse across videos.
 */
export async function createActor(
  photoUrl: string,
  voiceSampleUrl?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    source_url: photoUrl,
  };

  if (voiceSampleUrl) {
    body.voice = {
      type: "audio",
      audio_url: voiceSampleUrl,
    };
  }

  const res = await fetch(`${DID_API_URL}/actors`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`D-ID create actor failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.id;
}

export type AvatarStyle = "solo_host" | "interview" | "news_anchor" | "storyteller";

/**
 * Submit a D-ID talk creation request. Returns talkId for polling.
 * Does NOT poll — use `getTalkStatus()` separately with Inngest step.sleep().
 */
export async function submitTalk(input: {
  actorId?: string;
  photoUrl?: string;
  script: string;
  voiceId?: string;
  voiceSampleUrl?: string;
  style?: AvatarStyle;
}): Promise<string> {
  let voice: Record<string, unknown>;
  if (input.voiceSampleUrl) {
    voice = { type: "audio", audio_url: input.voiceSampleUrl };
  } else {
    voice = {
      type: "microsoft",
      voice_id: input.voiceId || "en-US-JennyNeural",
    };
  }

  const driverConfig = getDriverConfig(input.style);

  const body: Record<string, unknown> = {
    script: {
      type: "text",
      input: input.script,
      provider: voice,
    },
    config: {
      stitch: true,
      ...driverConfig,
    },
  };

  if (input.actorId) {
    body.actor_id = input.actorId;
  } else if (input.photoUrl) {
    body.source_url = input.photoUrl;
  } else {
    throw new Error("Either actorId or photoUrl is required");
  }

  const res = await fetch(`${DID_API_URL}/talks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`D-ID submit talk failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.id) throw new Error("No talk_id from D-ID");
  return data.id;
}

/**
 * Check the status of a D-ID talk.
 * Returns { status, videoUrl } — use with Inngest step.sleep() polling pattern.
 */
export async function getTalkStatus(
  talkId: string
): Promise<{ status: "pending" | "done" | "error"; videoUrl?: string; error?: string }> {
  const res = await fetch(`${DID_API_URL}/talks/${talkId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    return { status: "pending" };
  }

  const data = await res.json();

  if (data.status === "done" && data.result_url) {
    return { status: "done", videoUrl: data.result_url };
  }

  if (data.status === "error" || data.status === "rejected") {
    return {
      status: "error",
      error: data.error?.description || "D-ID generation failed",
    };
  }

  return { status: "pending" };
}

function getDriverConfig(style?: AvatarStyle): Record<string, unknown> {
  switch (style) {
    case "news_anchor":
      return {
        driver: "talk",
        result_format: "mp4",
        expression: { expressions: [{ start_frame: 0, expression: "serious", intensity: 0.5 }] },
      };
    case "interview":
      return {
        driver: "talk",
        result_format: "mp4",
        expression: { expressions: [{ start_frame: 0, expression: "happy", intensity: 0.3 }] },
      };
    case "storyteller":
      return {
        driver: "talk",
        result_format: "mp4",
        expression: { expressions: [{ start_frame: 0, expression: "surprise", intensity: 0.2 }] },
      };
    case "solo_host":
    default:
      return {
        driver: "talk",
        result_format: "mp4",
      };
  }
}

/**
 * List D-ID presenters (stock avatars).
 */
export async function listPresenters(): Promise<
  { id: string; name: string; thumbnailUrl: string }[]
> {
  try {
    const res = await fetch(`${DID_API_URL}/clips/actors`, {
      headers: getHeaders(),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.actors || []).map(
      (a: { actor_id: string; name?: string; image_url?: string }) => ({
        id: a.actor_id,
        name: a.name || "Presenter",
        thumbnailUrl: a.image_url || "",
      })
    );
  } catch {
    return [];
  }
}
