"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCreditsStore } from "@/stores/credits-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Zap,
  Lightbulb,
  FileText,
  Video,
  PlayCircle,
  Clock,
  CalendarDays,
  BarChart3,
  Settings,
  CreditCard,
  Coins,
  LogOut,
} from "lucide-react";
import { signOut } from "@/actions/auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Autopilot", href: "/autopilot", icon: Zap },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
  { label: "Scripts", href: "/scripts", icon: FileText },
  { label: "Create", href: "/create", icon: Video },
  { label: "Videos", href: "/videos", icon: PlayCircle },
  { label: "Scheduler", href: "/scheduler", icon: Clock },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { credits, plan, isLoading } = useCreditsStore();

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Credits & Sign Out */}
      <div className="border-t border-border p-4 space-y-2">
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <Coins className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Credits</p>
            <p className="text-sm font-semibold">
              {isLoading ? "..." : credits.toLocaleString()}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
            {plan}
          </span>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </>
  );
}

/** Desktop sidebar — hidden on mobile */
export function Sidebar() {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col border-r border-border bg-sidebar shrink-0">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Video className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">Baivid</span>
      </div>

      <SidebarContent />
    </aside>
  );
}

/** Mobile sidebar — slides in as a sheet */
export function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Video className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">Baivid</span>
          </SheetTitle>
        </SheetHeader>
        <SidebarContent onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
