import type { PublishInput, PublishResult } from "./types";

export async function publishToInstagram(input: PublishInput): Promise<PublishResult> {
  try {
    // Step 1: Create media container (Reels)
    const createRes = await fetch(
      `https://graph.facebook.com/v19.0/${input.platformUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: input.videoUrl,
          caption: `${input.title}\n\n${input.description}`.slice(0, 2200),
          access_token: input.accessToken,
        }),
      }
    );

    if (!createRes.ok) throw new Error(`Instagram create: ${createRes.status}`);
    const createData = await createRes.json();
    const containerId = createData.id;

    // Step 2: Poll until ready
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${input.accessToken}`
      );
      const statusData = await statusRes.json();
      if (statusData.status_code === "FINISHED") break;
      if (statusData.status_code === "ERROR") throw new Error("Instagram processing failed");
    }

    // Step 3: Publish
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${input.platformUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: input.accessToken,
        }),
      }
    );

    if (!publishRes.ok) throw new Error(`Instagram publish: ${publishRes.status}`);
    const publishData = await publishRes.json();

    return {
      success: true,
      postId: publishData.id,
      postUrl: `https://instagram.com/reel/${publishData.id}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Instagram publish failed" };
  }
}
