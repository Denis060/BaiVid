export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  genre: string;
  previewUrl: string; // direct audio URL for preview
  downloadUrl: string; // URL for mixing into video
  source: "pixabay" | "freesound" | "preset";
  bpm?: number;
  tags?: string[];
}

export interface MusicSearchParams {
  query?: string;
  genre?: string;
  minDuration?: number;
  maxDuration?: number;
  page?: number;
  perPage?: number;
}

// Preset tracks with CC0 licenses from FreeSound
const PRESET_TRACKS: MusicTrack[] = [
  {
    id: "preset-corporate-1",
    title: "Corporate Background Music",
    artist: "FreeSound Community",
    duration: 120,
    genre: "Corporate",
    previewUrl:
      "https://freesound.org/api/sounds/550556/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    downloadUrl:
      "https://freesound.org/api/sounds/550556/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    source: "freesound",
    bpm: 120,
    tags: ["corporate", "background", "upbeat"],
  },
  {
    id: "preset-lofi-1",
    title: "Lo-fi Hip Hop Study Beat",
    artist: "FreeSound Community",
    duration: 180,
    genre: "Lo-fi",
    previewUrl:
      "https://freesound.org/api/sounds/539750/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    downloadUrl:
      "https://freesound.org/api/sounds/539750/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    source: "freesound",
    bpm: 85,
    tags: ["lofi", "hiphop", "study", "chill"],
  },
  {
    id: "preset-cinematic-1",
    title: "Epic Cinematic Orchestra",
    artist: "FreeSound Community",
    duration: 150,
    genre: "Cinematic",
    previewUrl:
      "https://freesound.org/api/sounds/573593/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    downloadUrl:
      "https://freesound.org/api/sounds/573593/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    source: "freesound",
    bpm: 100,
    tags: ["cinematic", "orchestral", "epic", "trailer"],
  },
  {
    id: "preset-hiphop-1",
    title: "Funky Hip Hop Groove",
    artist: "FreeSound Community",
    duration: 90,
    genre: "Hip Hop",
    previewUrl:
      "https://freesound.org/api/sounds/532154/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    downloadUrl:
      "https://freesound.org/api/sounds/532154/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    source: "freesound",
    bpm: 95,
    tags: ["hiphop", "funk", "beat", "groove"],
  },
  {
    id: "preset-ambient-1",
    title: "Ambient Meditation Pad",
    artist: "FreeSound Community",
    duration: 240,
    genre: "Ambient",
    previewUrl:
      "https://freesound.org/api/sounds/564737/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    downloadUrl:
      "https://freesound.org/api/sounds/564737/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    source: "freesound",
    bpm: 60,
    tags: ["ambient", "meditation", "relaxing", "atmospheric"],
  },
  {
    id: "preset-electronic-1",
    title: "Synthwave Electronic Beat",
    artist: "FreeSound Community",
    duration: 120,
    genre: "Electronic",
    previewUrl:
      "https://freesound.org/api/sounds/612345/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    downloadUrl:
      "https://freesound.org/api/sounds/612345/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    source: "freesound",
    bpm: 128,
    tags: ["electronic", "synthwave", "edm", "dance"],
  },
  {
    id: "preset-afrobeats-1",
    title: "Afrobeats Dancehall Vibe",
    artist: "FreeSound Community",
    duration: 150,
    genre: "Afrobeats",
    previewUrl:
      "https://freesound.org/api/sounds/678901/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    downloadUrl:
      "https://freesound.org/api/sounds/678901/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    source: "freesound",
    bpm: 102,
    tags: ["afrobeats", "dancehall", "percussive", "vibrant"],
  },
  {
    id: "preset-acoustic-1",
    title: "Acoustic Guitar Fingerpicking",
    artist: "FreeSound Community",
    duration: 180,
    genre: "Acoustic",
    previewUrl:
      "https://freesound.org/api/sounds/445678/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    downloadUrl:
      "https://freesound.org/api/sounds/445678/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    source: "freesound",
    bpm: 90,
    tags: ["acoustic", "guitar", "fingerpicking", "warm"],
  },
  {
    id: "preset-jazz-1",
    title: "Smooth Jazz Trio",
    artist: "FreeSound Community",
    duration: 200,
    genre: "Jazz",
    previewUrl:
      "https://freesound.org/api/sounds/534567/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    downloadUrl:
      "https://freesound.org/api/sounds/534567/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    source: "freesound",
    bpm: 100,
    tags: ["jazz", "smooth", "trio", "relaxing"],
  },
  {
    id: "preset-indie-1",
    title: "Indie Pop Indie Rock Blend",
    artist: "FreeSound Community",
    duration: 160,
    genre: "Indie",
    previewUrl:
      "https://freesound.org/api/sounds/723456/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    downloadUrl:
      "https://freesound.org/api/sounds/723456/download/?token=8d0bc1c92370e8bcd17e3fcd66bffb3e",
    source: "freesound",
    bpm: 110,
    tags: ["indie", "rock", "pop", "alternative"],
  },
];

async function searchFreeSound(
  params: MusicSearchParams
): Promise<{ tracks: MusicTrack[]; total: number }> {
  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) {
    return { tracks: [], total: 0 };
  }

  try {
    const baseUrl = "https://freesound.org/apiv2/search/text/";
    const searchParams = new URLSearchParams();

    if (params.query) {
      searchParams.append("query", params.query);
    }

    // Filter by genre if provided
    if (params.genre && params.genre !== "All") {
      searchParams.append("filter", `tags:${params.genre.toLowerCase()}`);
    }

    // Filter by duration
    if (params.minDuration !== undefined || params.maxDuration !== undefined) {
      const minDur = params.minDuration || 0;
      const maxDur = params.maxDuration || 300;
      searchParams.append("filter", `duration:[${minDur} TO ${maxDur}]`);
    }

    searchParams.append("page_size", String(params.perPage || 20));
    searchParams.append("page", String(params.page || 1));
    searchParams.append(
      "fields",
      "id,name,duration,username,previews,tags,description,bitrate"
    );
    searchParams.append("token", apiKey);

    const url = `${baseUrl}?${searchParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BaiVid-Music-Browser/1.0",
      },
    });

    if (!response.ok) {
      return { tracks: [], total: 0 };
    }

    const data = (await response.json()) as {
      count?: number;
      results?: Array<{
        id: number;
        name: string;
        duration: number;
        username: string;
        previews: {
          "preview-lq-mp3"?: string;
          "preview-hq-mp3"?: string;
        };
        tags: Array<{ name: string }>;
        description?: string;
      }>;
    };

    const tracks: MusicTrack[] = (data.results || [])
      .filter((track) => {
        // Only include tracks with preview URLs
        return (
          track.previews["preview-hq-mp3"] ||
          track.previews["preview-lq-mp3"]
        );
      })
      .map((track) => {
        const previewUrl =
          track.previews["preview-hq-mp3"] ||
          track.previews["preview-lq-mp3"] ||
          "";
        return {
          id: `freesound-${track.id}`,
          title: track.name,
          artist: track.username,
          duration: Math.round(track.duration),
          genre: params.genre || "Other",
          previewUrl: previewUrl,
          downloadUrl: previewUrl,
          source: "freesound",
          tags: track.tags.map((t) => t.name),
        };
      });

    return {
      tracks,
      total: data.count || 0,
    };
  } catch (error) {
    console.error("FreeSound API error:", error);
    return { tracks: [], total: 0 };
  }
}

/**
 * Get the curated preset tracks. Used as fallback when no API keys are set.
 */
export async function getPresetTracks(): Promise<MusicTrack[]> {
  return PRESET_TRACKS;
}

export async function searchMusic(
  params: MusicSearchParams
): Promise<{ tracks: MusicTrack[]; total: number }> {
  // Try Pixabay music if query provided and API key available
  if (params.query && process.env.PIXABAY_API_KEY) {
    try {
      const { searchPixabayMusic } = await import("@/lib/providers/stock-footage");
      const pixabayTracks = await searchPixabayMusic(params.query, params.perPage || 20);
      if (pixabayTracks.length > 0) {
        const mapped: MusicTrack[] = pixabayTracks.map((t: { id: number; title: string; duration: number; url: string; artist: string; tags: string }) => ({
          id: `pixabay-music-${t.id}`,
          title: t.title,
          artist: t.artist,
          duration: t.duration,
          genre: params.genre || "Other",
          previewUrl: t.url,
          downloadUrl: t.url,
          source: "pixabay" as const,
          tags: t.tags.split(",").map((tag: string) => tag.trim()),
        }));
        return { tracks: mapped, total: mapped.length };
      }
    } catch (err) {
      console.error("Pixabay music search failed:", err);
    }
  }

  // If no query, return preset tracks filtered by genre/duration
  if (!params.query) {
    let filtered = [...PRESET_TRACKS];

    if (params.genre && params.genre !== "All") {
      filtered = filtered.filter(
        (t) => t.genre.toLowerCase() === params.genre?.toLowerCase()
      );
    }

    if (params.minDuration !== undefined) {
      filtered = filtered.filter((t) => t.duration >= params.minDuration!);
    }

    if (params.maxDuration !== undefined) {
      filtered = filtered.filter((t) => t.duration <= params.maxDuration!);
    }

    const page = params.page || 1;
    const perPage = params.perPage || 20;
    const start = (page - 1) * perPage;
    const end = start + perPage;

    return {
      tracks: filtered.slice(start, end),
      total: filtered.length,
    };
  }

  // Try FreeSound API first
  const freesoundResults = await searchFreeSound(params);

  // If we got results from FreeSound, return them
  if (freesoundResults.tracks.length > 0) {
    return freesoundResults;
  }

  // Fallback: search in preset tracks by query
  const query = params.query.toLowerCase();
  let filtered = PRESET_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(query) ||
      t.genre.toLowerCase().includes(query) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query)))
  );

  if (params.genre && params.genre !== "All") {
    filtered = filtered.filter(
      (t) => t.genre.toLowerCase() === params.genre?.toLowerCase()
    );
  }

  if (params.minDuration !== undefined) {
    filtered = filtered.filter((t) => t.duration >= params.minDuration!);
  }

  if (params.maxDuration !== undefined) {
    filtered = filtered.filter((t) => t.duration <= params.maxDuration!);
  }

  return {
    tracks: filtered,
    total: filtered.length,
  };
}