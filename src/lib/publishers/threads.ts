import type { PublishInput, PublishResult } from "./types";

export async function publishToThreads(input: PublishInput): Promise<PublishResult> {
  try {
    // Step 1: Create media container
    const createRes = await fetch(
      `https://graph.threads.net/v1.0/${input.platformUserId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "VIDEO",
          video_url: input.videoUrl,
          text: `${input.title}\n\n${input.description}`.slice(0, 500),
          access_token: input.accessToken,
        }),
      }
    );

    if (!createRes.ok) throw new Error(`Threads create: ${createRes.status}`);
    const createData = await createRes.json();
    const containerId = createData.id;

    // Step 2: Wait for processing
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const statusRes = await fetch(
        `https://graph.threads.net/v1.0/${containerId}?fields=status&access_token=${input.accessToken}`
      );
      const statusData = await statusRes.json();
      if (statusData.status === "FINISHED") break;
      if (statusData.status === "ERROR") throw new Error("Threads processing failed");
    }

    // Step 3: Publish
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${input.platformUserId}/threads_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: input.accessToken,
        }),
      }
    );

    if (!publishRes.ok) throw new Error(`Threads publish: ${publishRes.status}`);
    const publishData = await publishRes.json();

    return {
      success: true,
      postId: publishData.id,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Threads publish failed" };
  }
}
