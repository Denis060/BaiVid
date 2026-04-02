import type { PublishInput, PublishResult } from "./types";

export async function publishToYouTube(input: PublishInput): Promise<PublishResult> {
  try {
    // Step 1: Initialize resumable upload
    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            title: input.title.slice(0, 100),
            description: input.description.slice(0, 5000),
            categoryId: "22", // People & Blogs
          },
          status: {
            privacyStatus: "public",
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    );

    if (!initRes.ok) throw new Error(`YouTube init: ${initRes.status}`);
    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) throw new Error("No upload URL from YouTube");

    // Step 2: Download video and upload
    const videoRes = await fetch(input.videoUrl);
    if (!videoRes.ok) throw new Error("Failed to download video");
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(videoBuffer.length),
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) throw new Error(`YouTube upload: ${uploadRes.status}`);
    const data = await uploadRes.json();

    return {
      success: true,
      postId: data.id,
      postUrl: `https://youtube.com/watch?v=${data.id}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "YouTube publish failed" };
  }
}
