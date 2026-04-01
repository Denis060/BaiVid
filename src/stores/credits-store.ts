import { create } from "zustand";

interface CreditsState {
  credits: number;
  plan: "free" | "starter" | "pro" | "business";
  isLoading: boolean;
  setCredits: (credits: number) => void;
  setPlan: (plan: CreditsState["plan"]) => void;
  decrementCredits: (amount?: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useCreditsStore = create<CreditsState>((set) => ({
  credits: 0,
  plan: "free",
  isLoading: true,
  setCredits: (credits) => set({ credits }),
  setPlan: (plan) => set({ plan }),
  decrementCredits: (amount = 1) =>
    set((state) => ({ credits: Math.max(0, state.credits - amount) })),
  setLoading: (isLoading) => set({ isLoading }),
}));
