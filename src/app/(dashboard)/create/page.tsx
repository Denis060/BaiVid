import Link from "next/link";
import { Video, User } from "lucide-react";

export default function CreatePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create Video</h1>
      <p className="text-muted-foreground">Choose your video creation mode.</p>
      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/create/faceless"
          className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <Video className="h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Faceless Video</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create videos with stock footage, AI voiceover, and captions.
          </p>
        </Link>
        <Link
          href="/create/avatar"
          className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <User className="h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Avatar Video</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create videos with AI-generated talking head avatars.
          </p>
        </Link>
      </div>
    </div>
  );
}
