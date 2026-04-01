"use client";

import Link from "next/link";
import { Video } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Video className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Baivid</h1>
      </div>
      <p className="max-w-lg text-center text-lg text-muted-foreground">
        Create stunning AI-powered videos with avatars, faceless content, and
        automated publishing — all from one platform.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/signup"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          Get Started
        </Link>
        <Link
          href="/auth/login"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
