import type { PublishInput, PublishResult } from "./types";

export async function publishToPinterest(input: PublishInput): Promise<PublishResult> {
  try {
    const res = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: input.title.slice(0, 100),
        description: input.description.slice(0, 500),
        media_source: {
          source_type: "video_id",
          cover_image_url: input.videoUrl, // Placeholder
          media_id: input.videoUrl,
        },
      }),
    });

    if (!res.ok) throw new Error(`Pinterest: ${res.status}`);
    const data = await res.json();

    return {
      success: true,
      postId: data.id,
      postUrl: `https://pinterest.com/pin/${data.id}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Pinterest publish failed" };
  }
}
