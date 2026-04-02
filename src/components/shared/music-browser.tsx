"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { searchMusicAction, getMusicGenres } from "@/actions/music";
import type { MusicTrack } from "@/lib/music-service";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Check,
  Volume2,
  Loader2,
} from "lucide-react";

interface MusicBrowserProps {
  onSelect: (track: MusicTrack) => void;
  selectedTrackId?: string;
}

const DURATION_FILTERS = [
  { label: "Short (< 1 min)", min: 0, max: 60 },
  { label: "Medium (1-3 min)", min: 60, max: 180 },
  { label: "Long (> 3 min)", min: 180, max: 999 },
];

export function MusicBrowser({
  onSelect,
  selectedTrackId,
}: MusicBrowserProps) {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedDuration, setSelectedDuration] = useState<{
    min?: number;
    max?: number;
  }>({});
  const [genres, setGenres] = useState<string[]>([]);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load genres on mount
  useEffect(() => {
    async function loadGenres() {
      try {
        const loadedGenres = await getMusicGenres();
        setGenres(loadedGenres);
      } catch (error) {
        console.error("Failed to load genres:", error);
      }
    }
    loadGenres();
  }, []);

  // Debounced search function
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(
    async (
      query: string,
      genre: string,
      durationFilter: { min?: number; max?: number }
    ) => {
      setIsLoading(true);
      try {
        const result = await searchMusicAction({
          query: query || undefined,
          genre: genre !== "All" ? genre : undefined,
          minDuration: durationFilter.min,
          maxDuration: durationFilter.max,
          page: 1,
          perPage: 50,
        });
        setTracks(result.tracks);
        setTotal(result.total);
      } catch (error) {
        console.error("Search error:", error);
        setTracks([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounce wrapper
  const debouncedSearch = useCallback(
    (
      query: string,
      genre: string,
      durationFilter: { min?: number; max?: number }
    ) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query, genre, durationFilter);
      }, 300);
    },
    [performSearch]
  );

  // Trigger search on filter changes
  useEffect(() => {
    debouncedSearch(searchQuery, selectedGenre, selectedDuration);
  }, [searchQuery, selectedGenre, selectedDuration, debouncedSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handlePlayPause = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      // Start playing new track
      if (audioRef.current) {
        audioRef.current.src = track.previewUrl;
        audioRef.current.play().catch((err) => {
          console.error("Failed to play audio:", err);
        });
      }
      setPlayingTrackId(track.id);
    }
  };

  const handleAudioEnd = () => {
    setPlayingTrackId(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Hidden audio player */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        crossOrigin="anonymous"
      />

      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search tracks, artists, genres..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Genre filter chips */}
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Badge
            key={genre}
            variant={selectedGenre === genre ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedGenre(genre)}
          >
            {genre}
          </Badge>
        ))}
      </div>

      {/* Duration filter chips */}
      <div className="flex flex-wrap gap-2">
        {DURATION_FILTERS.map((filter) => {
          const isSelected =
            selectedDuration.min === filter.min &&
            selectedDuration.max === filter.max;
          return (
            <Badge
              key={filter.label}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => {
                if (isSelected) {
                  setSelectedDuration({});
                } else {
                  setSelectedDuration({ min: filter.min, max: filter.max });
                }
              }}
            >
              {filter.label}
            </Badge>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Track list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && tracks.length === 0 ? (
          <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading tracks...</span>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No tracks found. Try a different search.
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => {
              const isSelected = selectedTrackId === track.id;
              const isPlaying = playingTrackId === track.id;

              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent/50 ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border"
                  }`}
                  onClick={() => onSelect(track)}
                >
                  {/* Play button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause(track);
                    }}
                    className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artist}
                    </p>
                  </div>

                  {/* Duration and genre */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {track.genre}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDuration(track.duration)}
                    </span>
                  </div>

                  {/* Select button or checkmark */}
                  {isSelected ? (
                    <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(track);
                      }}
                      className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <span className="text-xs font-semibold">+</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer attribution */}
      <div className="flex items-center justify-center gap-1 pt-2 border-t border-border text-xs text-muted-foreground">
        <Volume2 className="h-3 w-3" />
        <span>Powered by FreeSound</span>
      </div>
    </div>
  );
}
