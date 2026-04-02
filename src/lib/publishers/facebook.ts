import type { PublishInput, PublishResult } from "./types";

export async function publishToFacebook(input: PublishInput): Promise<PublishResult> {
  try {
    const videoRes = await fetch(input.videoUrl);
    if (!videoRes.ok) throw new Error("Failed to download video");
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const formData = new FormData();
    formData.append("source", new Blob([videoBuffer], { type: "video/mp4" }), "video.mp4");
    formData.append("title", input.title.slice(0, 100));
    formData.append("description", input.description.slice(0, 5000));
    formData.append("access_token", input.accessToken);

    const res = await fetch(
      `https://graph-video.facebook.com/v19.0/${input.platformUserId}/videos`,
      { method: "POST", body: formData }
    );

    if (!res.ok) throw new Error(`Facebook upload: ${res.status}`);
    const data = await res.json();

    return {
      success: true,
      postId: data.id,
      postUrl: `https://facebook.com/${data.id}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Facebook publish failed" };
  }
}
