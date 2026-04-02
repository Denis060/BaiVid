"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { getScheduledPosts, reschedulePost } from "@/actions/scheduler";
import { PLATFORM_CONFIG, type PlatformKey } from "@/lib/publishers/types";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  tiktok: "#010101",
  instagram: "#E1306C",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  pinterest: "#E60023",
  twitter: "#000000",
  reddit: "#FF4500",
  threads: "#101010",
};

type ViewMode = "month" | "week" | "day";

interface CalendarEvent {
  id: string;
  title: string;
  platform: string;
  scheduledAt: Date;
  status: string;
  errorMessage?: string;
  username?: string;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Pad start of month to start on Sunday
  const startPad = firstDay.getDay();
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push(d);
  }

  // Days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Pad end to complete the last week
  const endPad = 6 - lastDay.getDay();
  for (let i = 1; i <= endPad; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - day);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Fetch 3 months of data
      const from = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
      const to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();

      const posts = await getScheduledPosts(from, to);
      setEvents(
        posts.map((p) => ({
          id: (p as Record<string, unknown>).id as string,
          title:
            ((p as Record<string, unknown>).videos as { title: string } | null)?.title ||
            "Untitled",
          platform: (p as Record<string, unknown>).platform as string,
          scheduledAt: new Date((p as Record<string, unknown>).scheduled_at as string),
          status: (p as Record<string, unknown>).status as string,
          errorMessage: (p as Record<string, unknown>).error_message as string | undefined,
          username:
            ((p as Record<string, unknown>).connected_accounts as { platform_username: string | null } | null)
              ?.platform_username || undefined,
        }))
      );
      setLoading(false);
    }
    load();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const days = useMemo(() => {
    if (viewMode === "month") {
      return getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    }
    if (viewMode === "week") {
      return getWeekDays(currentDate);
    }
    return [currentDate];
  }, [currentDate, viewMode]);

  function navigate(direction: number) {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + direction);
    else if (viewMode === "week") d.setDate(d.getDate() + 7 * direction);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  }

  function getEventsForDay(date: Date): CalendarEvent[] {
    return events.filter((e) => isSameDay(e.scheduledAt, date));
  }

  async function handleDrop(eventId: string, targetDate: Date) {
    const event = events.find((e) => e.id === eventId);
    if (!event || event.status !== "scheduled") return;

    // Keep the original time, change the date
    const newDate = new Date(targetDate);
    newDate.setHours(event.scheduledAt.getHours(), event.scheduledAt.getMinutes());

    await reschedulePost(eventId, newDate.toISOString());
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, scheduledAt: newDate } : e))
    );
    setDraggedEvent(null);
  }

  const today = new Date();
  const headerLabel =
    viewMode === "month"
      ? currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : viewMode === "week"
        ? `Week of ${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your content schedule.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {headerLabel}
          </h2>
          <Button variant="outline" size="icon-sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>
        <div className="flex gap-1">
          {(["month", "week", "day"] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode(mode)}
              className="capitalize"
            >
              {mode}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === "day" ? (
        // Day view — list of events
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getEventsForDay(currentDate).length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No posts scheduled for this day.
              </p>
            ) : (
              <div className="space-y-2">
                {getEventsForDay(currentDate).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r border-border p-1 ${
                    !isCurrentMonth ? "bg-muted/20" : ""
                  } ${isToday ? "bg-primary/5" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedEvent) handleDrop(draggedEvent, day);
                  }}
                >
                  <p
                    className={`text-xs font-medium mb-1 px-1 ${
                      isToday
                        ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                        : !isCurrentMonth
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        draggable={event.status === "scheduled"}
                        onDragStart={() => setDraggedEvent(event.id)}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left rounded px-1 py-0.5 text-[10px] font-medium truncate cursor-pointer hover:opacity-80 text-white"
                        style={{
                          backgroundColor: PLATFORM_COLORS[event.platform] || "#666",
                        }}
                      >
                        {event.platform === "twitter" && "⚠️ "}
                        {event.platform === "threads" && "β "}
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-muted-foreground px-1">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: PLATFORM_COLORS[selectedEvent.platform] }}
                />
                <span className="text-sm font-medium">
                  {PLATFORM_CONFIG[selectedEvent.platform as PlatformKey]?.name || selectedEvent.platform}
                </span>
                {selectedEvent.username && (
                  <span className="text-sm text-muted-foreground">
                    @{selectedEvent.username}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {selectedEvent.scheduledAt.toLocaleString()}
              </div>

              <Badge
                className={`${
                  selectedEvent.status === "published"
                    ? "bg-green-500/10 text-green-500"
                    : selectedEvent.status === "failed"
                      ? "bg-red-500/10 text-red-500"
                      : selectedEvent.status === "cancelled"
                        ? "bg-muted text-muted-foreground"
                        : "bg-blue-500/10 text-blue-500"
                }`}
              >
                {selectedEvent.status === "published" && <CheckCircle className="mr-1 h-3 w-3" />}
                {selectedEvent.status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                {selectedEvent.status === "scheduled" && <Clock className="mr-1 h-3 w-3" />}
                {selectedEvent.status}
              </Badge>

              {selectedEvent.errorMessage && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertTriangle className="inline mr-2 h-4 w-4" />
                  {selectedEvent.errorMessage}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EventCard({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-accent/50 transition-colors"
    >
      <div
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: PLATFORM_COLORS[event.platform] }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {event.scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &middot;{" "}
          {PLATFORM_CONFIG[event.platform as PlatformKey]?.name}
          {event.username && ` @${event.username}`}
        </p>
      </div>
      <Badge
        className={`text-xs shrink-0 ${
          event.status === "published"
            ? "bg-green-500/10 text-green-500"
            : event.status === "failed"
              ? "bg-red-500/10 text-red-500"
              : "bg-blue-500/10 text-blue-500"
        }`}
      >
        {event.status}
      </Badge>
    </button>
  );
}
