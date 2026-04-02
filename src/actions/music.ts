"use server";

import {
  searchMusic as searchMusicService,
  type MusicSearchParams,
  type MusicTrack,
} from "@/lib/music-service";

export async function searchMusicAction(
  params: MusicSearchParams
): Promise<{
  tracks: MusicTrack[];
  total: number;
}> {
  try {
    return await searchMusicService(params);
  } catch (error) {
    console.error("Music search error:", error);
    return {
      tracks: [],
      total: 0,
    };
  }
}

export async function getMusicGenres(): Promise<string[]> {
  return [
    "All",
    "Corporate",
    "Lo-fi",
    "Cinematic",
    "Hip Hop",
    "Electronic",
    "Afrobeats",
    "Acoustic",
    "Jazz",
    "Ambient",
    "Indie",
  ];
}
