"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, Sun, Moon, Monitor, Menu, User, Settings, LogOut, CreditCard, Coins } from "lucide-react";
import { signOut } from "@/actions/auth";
import { useCreditsStore } from "@/stores/credits-store";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  onMenuClick: () => void;
}

interface UserProfile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { setTheme } = useTheme();
  const { plan, credits } = useCreditsStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("full_name, email, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
    }
    fetchProfile();
  }, []);

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      {/* Mobile menu button */}
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground relative">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground relative">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold">Notifications</p>
            </div>
            <DropdownMenuSeparator />
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No new notifications
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User profile */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 shrink-0">
              {initials ? (
                <span className="text-xs font-semibold text-primary">
                  {initials}
                </span>
              ) : (
                <User className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            {profile?.full_name && (
              <span className="text-sm font-medium hidden sm:inline truncate max-w-[120px]">
                {profile.full_name}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* User info */}
            <div className="px-3 py-3">
              <p className="text-sm font-semibold">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email || ""}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="capitalize text-xs">
                  {plan} plan
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Coins className="h-3 w-3" />
                  {credits.toLocaleString()} credits
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/settings" className="flex w-full items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/billing" className="flex w-full items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <form action={signOut} className="w-full">
                <button type="submit" className="flex w-full items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
