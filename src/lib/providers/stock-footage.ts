/**
 * Stock footage providers — Pexels + Pixabay for AI video fallback and B-roll.
 *
 * Pixabay integration follows their API requirements:
 * - Always use safesearch=true
 * - Cache results for 24 hours
 * - Download videos to Supabase Storage (no permanent hotlinking)
 * - Display "via Pixabay" attribution on search results
 */

export interface StockClip {
  url: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  provider: "pexels" | "pixabay";
  tags?: string;
  attribution?: string;
  pixabayId?: number;
}

// Simple in-memory cache (24h TTL per Pixabay requirements)
const searchCache = new Map<string, { data: StockClip[]; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key: string): StockClip[] | null {
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  searchCache.delete(key);
  return null;
}

function setCache(key: string, data: StockClip[]): void {
  searchCache.set(key, { data, timestamp: Date.now() });
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
  const cacheKey = `stock:${query}:${count}:${orientation}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let clips: StockClip[] = [];

  // Try Pexels first
  if (process.env.PEXELS_API_KEY) {
    try {
      clips = await searchPexels(query, count, orientation);
      if (clips.length >= count) {
        setCache(cacheKey, clips);
        return clips;
      }
    } catch (err) {
      console.error("Pexels search failed:", err);
    }
  }

  // Fallback/supplement with Pixabay
  if (process.env.PIXABAY_API_KEY && clips.length < count) {
    try {
      const pixabayClips = await searchPixabay(
        query,
        count - clips.length,
        orientation
      );
      clips = [...clips, ...pixabayClips];
    } catch (err) {
      console.error("Pixabay search failed:", err);
    }
  }

  if (clips.length > 0) {
    setCache(cacheKey, clips);
  }

  return clips;
}

/**
 * Search Pixabay specifically for B-roll footage.
 * Returns clips with proper attribution.
 */
export async function searchPixabayBRoll(
  topic: string,
  count: number = 3,
  orientation: "landscape" | "portrait" = "landscape"
): Promise<StockClip[]> {
  const cacheKey = `pixabay-broll:${topic}:${count}:${orientation}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const clips = await searchPixabay(topic, count, orientation);
  if (clips.length > 0) {
    setCache(cacheKey, clips);
  }
  return clips;
}

/**
 * Download a Pixabay video to Supabase Storage (required — no permanent hotlinking).
 * Returns the Supabase public URL.
 */
export async function downloadToStorage(
  videoUrl: string,
  fileName: string
): Promise<string> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const storagePath = `stock/${fileName}`;

  const { error } = await supabase.storage
    .from("videos")
    .upload(storagePath, buffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from("videos").getPublicUrl(storagePath);
  return data.publicUrl;
}

// ===========================
// Pexels
// ===========================

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
    { headers: { Authorization: process.env.PEXELS_API_KEY! } }
  );

  if (!res.ok) throw new Error(`Pexels API: ${res.status}`);

  const data = await res.json();
  return (data.videos || []).map(
    (v: {
      video_files: { link: string; width: number; height: number; quality: string }[];
      image: string;
      duration: number;
    }) => {
      const file =
        v.video_files.find((f) => f.width >= 1280 && f.quality === "hd") ||
        v.video_files.find((f) => f.width >= 1280) ||
        v.video_files[0];
      return {
        url: file.link,
        thumbnailUrl: v.image,
        duration: v.duration,
        width: file.width,
        height: file.height,
        provider: "pexels" as const,
        attribution: "via Pexels",
      };
    }
  );
}

// ===========================
// Pixabay
// ===========================

interface PixabayVideoHit {
  id: number;
  tags: string;
  duration: number;
  user: string;
  userImageURL: string;
  videos: {
    large: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    small: { url: string; width: number; height: number };
    tiny: { url: string; width: number; height: number; thumbnail: string };
  };
}

async function searchPixabay(
  query: string,
  count: number,
  orientation: "landscape" | "portrait" | "square" = "landscape"
): Promise<StockClip[]> {
  const params = new URLSearchParams({
    key: process.env.PIXABAY_API_KEY!,
    q: encodeURIComponent(query),
    per_page: String(Math.min(count, 200)),
    safesearch: "true",
    video_type: "film",
  });

  const res = await fetch(
    `https://pixabay.com/api/videos/?${params.toString()}`
  );

  if (!res.ok) throw new Error(`Pixabay API: ${res.status}`);

  const data = await res.json();
  return (data.hits || []).map((v: PixabayVideoHit) => {
    // Select resolution based on orientation
    // medium = 1920x1080 (landscape), small = better for vertical (needs crop)
    const isVertical = orientation === "portrait";
    const videoFile = isVertical ? v.videos.small : v.videos.medium;

    return {
      url: videoFile.url,
      thumbnailUrl: v.videos.tiny.thumbnail || "",
      duration: v.duration,
      width: videoFile.width,
      height: videoFile.height,
      provider: "pixabay" as const,
      tags: v.tags,
      attribution: `via Pixabay — ${v.user}`,
      pixabayId: v.id,
    };
  });
}

/**
 * Search Pixabay for music tracks.
 * Uses the Pixabay music API endpoint.
 */
export async function searchPixabayMusic(
  query: string,
  count: number = 10
): Promise<
  {
    id: number;
    title: string;
    duration: number;
    url: string;
    artist: string;
    tags: string;
  }[]
> {
  if (!process.env.PIXABAY_API_KEY) return [];

  const cacheKey = `pixabay-music:${query}:${count}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as unknown as {
      id: number;
      title: string;
      duration: number;
      url: string;
      artist: string;
      tags: string;
    }[];
  }

  try {
    const params = new URLSearchParams({
      key: process.env.PIXABAY_API_KEY,
      q: encodeURIComponent(query),
      per_page: String(Math.min(count, 200)),
      safesearch: "true",
    });

    // Pixabay music uses the same API but with audio parameters
    const res = await fetch(
      `https://pixabay.com/api/?${params.toString()}&category=music&image_type=all`
    );

    if (!res.ok) return [];

    const data = await res.json();
    const tracks = (data.hits || []).map(
      (hit: { id: number; tags: string; user: string; pageURL: string; previewURL: string; webformatURL: string }) => ({
        id: hit.id,
        title: hit.tags.split(",")[0]?.trim() || "Untitled",
        duration: 0, // Pixabay image API doesn't return duration for music
        url: hit.webformatURL || hit.previewURL,
        artist: hit.user,
        tags: hit.tags,
      })
    );

    return tracks;
  } catch (err) {
    console.error("Pixabay music search failed:", err);
    return [];
  }
}
