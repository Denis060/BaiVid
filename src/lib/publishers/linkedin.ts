import type { PublishInput, PublishResult } from "./types";

export async function publishToLinkedIn(input: PublishInput): Promise<PublishResult> {
  try {
    // Step 1: Register upload
    const registerRes = await fetch("https://api.linkedin.com/v2/videos?action=initializeUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: `urn:li:person:${input.platformUserId}`,
          fileSizeBytes: 0, // Will be set after download
        },
      }),
    });

    if (!registerRes.ok) throw new Error(`LinkedIn register: ${registerRes.status}`);
    const registerData = await registerRes.json();
    const uploadUrl = registerData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
    const asset = registerData.value?.video;

    if (!uploadUrl || !asset) throw new Error("No upload URL from LinkedIn");

    // Step 2: Upload video
    const videoRes = await fetch(input.videoUrl);
    if (!videoRes.ok) throw new Error("Failed to download video");
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: videoBuffer,
    });

    if (!uploadRes.ok) throw new Error(`LinkedIn upload: ${uploadRes.status}`);

    // Step 3: Create post
    const postRes = await fetch("https://api.linkedin.com/v2/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: `urn:li:person:${input.platformUserId}`,
        commentary: `${input.title}\n\n${input.description}`.slice(0, 3000),
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED" },
        content: { media: { id: asset } },
        lifecycleState: "PUBLISHED",
      }),
    });

    if (!postRes.ok) throw new Error(`LinkedIn post: ${postRes.status}`);
    const postData = await postRes.json();

    return { success: true, postId: postData.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "LinkedIn publish failed" };
  }
}
