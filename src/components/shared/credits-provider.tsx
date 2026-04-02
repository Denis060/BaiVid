"use client";

import { useEffect, useCallback } from "react";
import { useCreditsStore } from "@/stores/credits-store";
import { createClient } from "@/lib/supabase/client";

/**
 * Hydrates the Zustand credits store from the database on mount,
 * subscribes to realtime updates, and polls as fallback.
 */
export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { setCredits, setPlan, setLoading } = useCreditsStore();

  const fetchCredits = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("credits_balance, plan")
      .eq("id", user.id)
      .single();

    if (data) {
      setCredits(data.credits_balance);
      setPlan(data.plan);
    }
    setLoading(false);
  }, [setCredits, setPlan, setLoading]);

  useEffect(() => {
    // Initial fetch
    fetchCredits();

    // Realtime subscription (works if Supabase Realtime is enabled for users table)
    const supabase = createClient();
    const channel = supabase
      .channel("credits-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users" },
        (payload) => {
          const updated = payload.new as {
            credits_balance: number;
            plan: string;
          };
          setCredits(updated.credits_balance);
          setPlan(updated.plan as "free" | "starter" | "pro" | "agency");
        }
      )
      .subscribe();

    // Polling fallback: refetch every 10 seconds
    // Ensures credits update even if Realtime isn't enabled
    const pollInterval = setInterval(fetchCredits, 10000);

    // Also refetch when window regains focus (user switches back to tab)
    const handleFocus = () => fetchCredits();
    window.addEventListener("focus", handleFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchCredits, setCredits, setPlan]);

  return <>{children}</>;
}
