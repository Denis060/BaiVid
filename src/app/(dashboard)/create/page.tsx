import Link from "next/link";
import { Video, User, Music, LinkIcon } from "lucide-react";

const MODES = [
  {
    href: "/create/faceless",
    icon: Video,
    title: "Faceless Video",
    desc: "AI-generated visuals with voiceover narration and auto-captions. Perfect for tutorials and listicles.",
    cost: "13 credits/min",
    emoji: "🎬",
  },
  {
    href: "/create/avatar",
    icon: User,
    title: "Avatar Video",
    desc: "AI talking-head presenter with lip-sync. Upload a photo and your script comes to life.",
    cost: "18 credits/min",
    emoji: "🧑‍💼",
  },
  {
    href: "/create/audio",
    icon: Music,
    title: "Audio to Video",
    desc: "Upload a podcast or audio file and we generate matching visuals automatically.",
    cost: "10 credits/min",
    emoji: "🎙️",
  },
  {
    href: "/create/url",
    icon: LinkIcon,
    title: "URL to Video",
    desc: "Paste an article URL and we turn it into a narrated video with AI visuals.",
    cost: "15 credits",
    emoji: "🔗",
  },
];

export default function CreatePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Create Video</h1>
        <p className="text-muted-foreground mt-1">
          Choose how you want to create your next video.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {MODES.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-accent/50 hover:ring-1 hover:ring-primary/30"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{mode.emoji}</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {mode.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {mode.desc}
                </p>
                <p className="mt-3 text-xs text-primary font-medium">
                  {mode.cost}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
