import type { PublishInput, PublishResult } from "./types";

export async function publishToTikTok(input: PublishInput): Promise<PublishResult> {
  try {
    // Step 1: Initialize upload
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: input.title.slice(0, 150),
          privacy_level: "PUBLIC_TO_EVERYONE",
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: input.videoUrl,
        },
      }),
    });

    if (!initRes.ok) throw new Error(`TikTok init: ${initRes.status}`);
    const data = await initRes.json();

    return {
      success: true,
      postId: data.data?.publish_id,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "TikTok publish failed" };
  }
}
