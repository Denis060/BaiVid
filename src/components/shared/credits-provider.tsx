"use client";

import { useEffect } from "react";
import { useCreditsStore } from "@/stores/credits-store";
import { createClient } from "@/lib/supabase/client";

/**
 * Hydrates the Zustand credits store from the database on mount,
 * and subscribes to realtime updates for live balance changes.
 */
export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { setCredits, setPlan, setLoading } = useCreditsStore();

  useEffect(() => {
    const supabase = createClient();

    async function fetchCredits() {
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
    }

    fetchCredits();

    // Subscribe to realtime updates on the users table
    const channel = supabase
      .channel("credits-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
        },
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setCredits, setPlan, setLoading]);

  return <>{children}</>;
}
