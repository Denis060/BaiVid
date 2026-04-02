"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Link2,
  Unlink,
  AlertTriangle,
  Info,
  ChevronLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getConnectedAccounts, disconnectAccount } from "@/actions/scheduler";
import { PLATFORM_CONFIG, type PlatformKey } from "@/lib/publishers/types";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "bg-red-500",
  tiktok: "bg-gray-900 dark:bg-white",
  instagram: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500",
  facebook: "bg-blue-600",
  linkedin: "bg-blue-700",
  pinterest: "bg-red-600",
  twitter: "bg-black dark:bg-white",
  reddit: "bg-orange-500",
  threads: "bg-gray-800",
};

const PLATFORM_ICONS: Record<string, string> = {
  youtube: "▶️",
  tiktok: "♪",
  instagram: "📸",
  facebook: "f",
  linkedin: "in",
  pinterest: "📌",
  twitter: "𝕏",
  reddit: "👽",
  threads: "@",
};

const ALL_PLATFORMS = Object.keys(PLATFORM_CONFIG) as PlatformKey[];

function ConnectionsContent() {
  const [accounts, setAccounts] = useState<
    { id: string; platform: string; platform_username: string | null; platform_user_id: string; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const connectedPlatform = searchParams.get("connected");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    async function load() {
      const data = await getConnectedAccounts();
      setAccounts(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDisconnect(accountId: string) {
    setDisconnecting(accountId);
    await disconnectAccount(accountId);
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    setDisconnecting(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="text-3xl font-bold">Platform Connections</h1>
        <p className="text-muted-foreground mt-1">
          Connect your social media accounts to publish videos directly from Baivid.
        </p>
      </div>

      {connectedPlatform && (
        <div className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Successfully connected {PLATFORM_CONFIG[connectedPlatform as PlatformKey]?.name || connectedPlatform}!
        </div>
      )}

      {errorParam && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0" />
          {errorParam === "token_exchange_failed"
            ? "Failed to connect — the platform rejected the authorization. Please try again."
            : errorParam === "invalid_state"
              ? "Connection failed — security check failed. Please try again."
              : errorParam === "not_configured"
                ? "This platform is not configured yet. Contact support."
                : `Connection failed: ${errorParam.replace(/_/g, " ")}`}
        </div>
      )}

      <div className="space-y-3">
        {ALL_PLATFORMS.map((platform) => {
          const config = PLATFORM_CONFIG[platform];
          const account = accounts.find((a) => a.platform === platform);
          const isConnected = !!account;

          return (
            <Card key={platform} className={isConnected ? "border-primary/30" : ""}>
              <CardContent className="flex items-center gap-4 py-4">
                {/* Platform icon */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold shrink-0 ${PLATFORM_COLORS[platform] || "bg-muted"}`}
                >
                  {PLATFORM_ICONS[platform]}
                </div>

                {/* Platform info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{config.name}</p>
                    {config.comingSoon && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-500">
                        Beta
                      </Badge>
                    )}
                    {config.warning && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px]">
                          <p className="text-xs">{config.warning}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {isConnected ? (
                    <p className="text-xs text-muted-foreground">
                      @{account.platform_username || account.platform_user_id} &middot; Connected{" "}
                      {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}

                  {/* Twitter/X warning */}
                  {platform === "twitter" && !isConnected && (
                    <p className="text-[10px] text-yellow-500 flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      Requires X API paid tier ($100+/mo)
                    </p>
                  )}
                </div>

                {/* Action */}
                {isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnecting === account.id}
                    className="shrink-0"
                  >
                    {disconnecting === account.id ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Unlink className="mr-2 h-3 w-3" />
                    )}
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="shrink-0"
                    disabled={config.comingSoon}
                    onClick={() => {
                      // In production, this would initiate OAuth flow
                      // For now, redirect to a placeholder
                      window.location.href = `/api/oauth/${platform}/connect`;
                    }}
                  >
                    <Link2 className="mr-2 h-3 w-3" />
                    Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Platform Connections</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Baivid uses OAuth to securely connect to your social media accounts.
            We never store your passwords — only OAuth tokens with limited scopes.
          </p>
          <p>
            You can disconnect any platform at any time. Disconnecting will cancel
            any scheduled posts for that platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ConnectionsContent />
    </Suspense>
  );
}
