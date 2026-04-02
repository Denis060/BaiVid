import type { PublishInput, PublishResult } from "./types";

export async function publishToTwitter(input: PublishInput): Promise<PublishResult> {
  try {
    // Step 1: Upload media via chunked upload
    const videoRes = await fetch(input.videoUrl);
    if (!videoRes.ok) throw new Error("Failed to download video");
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    // INIT
    const initParams = new URLSearchParams({
      command: "INIT",
      total_bytes: String(videoBuffer.length),
      media_type: "video/mp4",
      media_category: "tweet_video",
    });

    const initRes = await fetch(
      `https://upload.twitter.com/1.1/media/upload.json?${initParams.toString()}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${input.accessToken}` },
      }
    );

    if (!initRes.ok) throw new Error(`Twitter INIT: ${initRes.status}`);
    const initData = await initRes.json();
    const mediaId = initData.media_id_string;

    // APPEND (single chunk for simplicity)
    const appendForm = new FormData();
    appendForm.append("command", "APPEND");
    appendForm.append("media_id", mediaId);
    appendForm.append("segment_index", "0");
    appendForm.append("media_data", new Blob([videoBuffer], { type: "video/mp4" }));

    const appendRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: { Authorization: `Bearer ${input.accessToken}` },
      body: appendForm,
    });

    if (!appendRes.ok) throw new Error(`Twitter APPEND: ${appendRes.status}`);

    // FINALIZE
    const finalizeRes = await fetch(
      `https://upload.twitter.com/1.1/media/upload.json?command=FINALIZE&media_id=${mediaId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${input.accessToken}` },
      }
    );

    if (!finalizeRes.ok) throw new Error(`Twitter FINALIZE: ${finalizeRes.status}`);

    // Wait for processing
    await new Promise((r) => setTimeout(r, 10000));

    // Create tweet
    const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `${input.title}\n\n${input.description}`.slice(0, 280),
        media: { media_ids: [mediaId] },
      }),
    });

    if (!tweetRes.ok) throw new Error(`Twitter tweet: ${tweetRes.status}`);
    const tweetData = await tweetRes.json();

    return {
      success: true,
      postId: tweetData.data?.id,
      postUrl: `https://x.com/i/status/${tweetData.data?.id}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Twitter publish failed" };
  }
}
