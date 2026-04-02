import type { PublishInput, PublishResult } from "./types";

export async function publishToReddit(
  input: PublishInput & { subreddit?: string }
): Promise<PublishResult> {
  try {
    const subreddit = input.subreddit || "videos";

    const res = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        sr: subreddit,
        kind: "link",
        title: input.title.slice(0, 300),
        url: input.videoUrl,
        resubmit: "true",
        nsfw: "false",
      }).toString(),
    });

    if (!res.ok) throw new Error(`Reddit: ${res.status}`);
    const data = await res.json();

    const postId = data.json?.data?.id;
    return {
      success: true,
      postId,
      postUrl: postId ? `https://reddit.com/comments/${postId}` : undefined,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Reddit publish failed" };
  }
}
