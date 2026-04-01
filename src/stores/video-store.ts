import { create } from "zustand";

interface VideoState {
  currentVideoId: string | null;
  isGenerating: boolean;
  progress: number;
  setCurrentVideoId: (id: string | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setProgress: (progress: number) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  currentVideoId: null,
  isGenerating: false,
  progress: 0,
  setCurrentVideoId: (currentVideoId) => set({ currentVideoId }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setProgress: (progress) => set({ progress }),
}));
