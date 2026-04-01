/**
 * Stock footage providers — Pexels + Pixabay fallback for when AI video fails.
 */

export interface StockClip {
  url: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  provider: "pexels" | "pixabay";
}

/**
 * Search for stock video clips matching a query.
 * Tries Pexels first, falls back to Pixabay.
 */
export async function searchStockFootage(
  query: string,
  count: number = 5,
  orientation: "landscape" | "portrait" | "square" = "landscape"
): Promise<StockClip[]> {
  let clips: StockClip[] = [];

  // Try Pexels first
  if (process.env.PEXELS_API_KEY) {
    try {
      clips = await searchPexels(query, count, orientation);
      if (clips.length >= count) return clips;
    } catch (err) {
      console.error("Pexels search failed:", err);
    }
  }

  // Fallback to Pixabay
  if (process.env.PIXABAY_API_KEY && clips.length < count) {
    try {
      const pixabayClips = await searchPixabay(
        query,
        count - clips.length
      );
      clips = [...clips, ...pixabayClips];
    } catch (err) {
      console.error("Pixabay search failed:", err);
    }
  }

  return clips;
}

async function searchPexels(
  query: string,
  count: number,
  orientation: string
): Promise<StockClip[]> {
  const params = new URLSearchParams({
    query,
    per_page: String(count),
    orientation,
  });

  const res = await fetch(
    `https://api.pexels.com/videos/search?${params.toString()}`,
    {
      headers: { Authorization: process.env.PEXELS_API_KEY! },
    }
  );

  if (!res.ok) throw new Error(`Pexels API: ${res.status}`);

  const data = await res.json();
  return (data.videos || []).map(
    (v: {
      video_files: { link: string; width: number; height: number }[];
      image: string;
      duration: number;
    }) => {
      // Pick the best quality file (HD preferred)
      const file =
        v.video_files.find((f) => f.width >= 1280) || v.video_files[0];
      return {
        url: file.link,
        thumbnailUrl: v.image,
        duration: v.duration,
        width: file.width,
        height: file.height,
        provider: "pexels" as const,
      };
    }
  );
}

async function searchPixabay(
  query: string,
  count: number
): Promise<StockClip[]> {
  const params = new URLSearchParams({
    key: process.env.PIXABAY_API_KEY!,
    q: query,
    per_page: String(count),
    video_type: "film",
  });

  const res = await fetch(
    `https://pixabay.com/api/videos/?${params.toString()}`
  );

  if (!res.ok) throw new Error(`Pixabay API: ${res.status}`);

  const data = await res.json();
  return (data.hits || []).map(
    (v: {
      videos: { medium: { url: string; width: number; height: number } };
      duration: number;
    }) => ({
      url: v.videos.medium.url,
      thumbnailUrl: "",
      duration: v.duration,
      width: v.videos.medium.width,
      height: v.videos.medium.height,
      provider: "pixabay" as const,
    })
  );
}
