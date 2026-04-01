"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, Coins, CreditCard, ExternalLink } from "lucide-react";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { useCreditsStore } from "@/stores/credits-store";
import { createClient } from "@/lib/supabase/client";
import type { CreditTransaction } from "@/types";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    credits: 50,
    features: [
      "50 credits/month",
      "Faceless videos only",
      "720p export",
      "Baivid watermark",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    price: 12,
    credits: 200,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER,
    features: [
      "200 credits/month",
      "Faceless + Avatar videos",
      "1080p export",
      "No watermark",
      "5 scheduled posts",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 29,
    credits: 500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
    features: [
      "500 credits/month",
      "All video types",
      "4K export",
      "Autopilot mode",
      "Unlimited scheduling",
      "Priority support",
    ],
  },
  {
    key: "agency",
    name: "Agency",
    price: 79,
    credits: 2000,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY,
    features: [
      "2,000 credits/month",
      "All video types",
      "4K export",
      "Autopilot mode",
      "Unlimited scheduling",
      "Priority support",
      "API access",
      "Team collaboration",
    ],
  },
] as const;

const TOPUPS = [
  { name: "100 Credits", credits: 100, price: 5, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TOPUP_SMALL },
  { name: "350 Credits", credits: 350, price: 15, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TOPUP_MEDIUM },
  { name: "1,000 Credits", credits: 1000, price: 40, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TOPUP_LARGE },
] as const;

function SettingsContent() {
  const { credits, plan } = useCreditsStore();
  const searchParams = useSearchParams();
  const billingStatus = searchParams.get("billing");

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingTopup, setLoadingTopup] = useState<number | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      const supabase = createClient();
      const { data } = await supabase
        .from("credits_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setTransactions(data || []);
      setLoadingTransactions(false);
    }
    fetchTransactions();
  }, []);

  async function handleSubscribe(priceId: string | undefined, planKey: string) {
    if (!priceId) return;
    setLoadingPlan(planKey);
    try {
      await createCheckoutSession(priceId, "subscription");
    } catch {
      setLoadingPlan(null);
    }
  }

  async function handleTopup(priceId: string | undefined, index: number) {
    if (!priceId) return;
    setLoadingTopup(index);
    try {
      await createCheckoutSession(priceId, "payment");
    } catch {
      setLoadingTopup(null);
    }
  }

  async function handleManageSubscription() {
    setLoadingPortal(true);
    try {
      await createPortalSession();
    } catch {
      setLoadingPortal(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your plan, billing, and credits.
        </p>
      </div>

      {billingStatus === "success" && (
        <div className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary">
          Payment successful! Your plan has been updated.
        </div>
      )}
      {billingStatus === "cancelled" && (
        <div className="rounded-lg border border-muted-foreground/50 bg-muted px-4 py-3 text-sm text-muted-foreground">
          Checkout was cancelled.
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold capitalize">{plan}</span>
                <Badge variant="outline" className="capitalize">{plan}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {credits.toLocaleString()} credits remaining
              </p>
            </div>
            {plan !== "free" && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
              >
                {loadingPortal ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const isCurrent = plan === p.key;
            return (
              <Card
                key={p.key}
                className={isCurrent ? "border-primary" : ""}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <CardDescription>
                    {p.price === 0 ? (
                      "Free forever"
                    ) : (
                      <span>
                        <span className="text-2xl font-bold text-foreground">
                          ${p.price}
                        </span>
                        /month
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : p.key === "free" ? (
                    <Button className="w-full" variant="outline" disabled>
                      Free
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(p.priceId, p.key)}
                      disabled={loadingPlan === p.key}
                    >
                      {loadingPlan === p.key ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {isCurrent ? "Current" : plan === "free" ? "Upgrade" : "Switch"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Top-up Packs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Buy Credits</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TOPUPS.map((pack, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  {pack.name}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">
                    ${pack.price}
                  </span>{" "}
                  one-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleTopup(pack.priceId, i)}
                  disabled={loadingTopup === i}
                >
                  {loadingTopup === i ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Coins className="mr-2 h-4 w-4" />
                  )}
                  Buy {pack.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Transaction History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Credit History</h2>
        {loadingTransactions ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No transactions yet.
          </p>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {tx.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize text-xs">
                        {tx.type}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      tx.amount >= 0 ? "text-primary" : "text-destructive"
                    }`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {tx.balance_after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
