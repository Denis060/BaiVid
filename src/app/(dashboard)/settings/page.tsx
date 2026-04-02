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
import { Loader2, Check, Coins, CreditCard, ExternalLink, Mail } from "lucide-react";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import {
  getEmailPreferences,
  updateEmailPreferences,
  type EmailPreferencesInput,
} from "@/actions/email-preferences";
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
    credits: 500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER,
    features: [
      "500 credits/month",
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
    credits: 1500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
    features: [
      "1,500 credits/month",
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
    credits: 5000,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY,
    features: [
      "5,000 credits/month",
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
  { name: "Micro", credits: 100, price: 2, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TOPUP_MICRO },
  { name: "Small", credits: 300, price: 5, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TOPUP_SMALL },
  { name: "Standard", credits: 800, price: 12, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TOPUP_STANDARD },
  { name: "Value", credits: 2000, price: 25, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TOPUP_VALUE },
  { name: "Pro", credits: 6000, price: 60, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TOPUP_PRO },
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
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferencesInput>({
    video_ready: true,
    credits_low: true,
    subscription_change: true,
    weekly_digest: true,
    autopilot_approval: true,
    marketing: true,
  });
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("credits_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setTransactions(data || []);
      setLoadingTransactions(false);

      const prefs = await getEmailPreferences();
      if (prefs) setEmailPrefs(prefs);
      setLoadingPrefs(false);
    }
    fetchData();
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
                      {plan === "free" ? "Upgrade" : "Switch"}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {TOPUPS.map((pack, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  {pack.name}
                </CardTitle>
                <CardDescription>
                  {pack.credits.toLocaleString()} credits
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
                  ) : null}
                  ${pack.price}
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
          <div className="rounded-lg border overflow-x-auto">
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
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
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
      <Separator />

      {/* Email Preferences */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
        {loadingPrefs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose which email notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: "video_ready" as const, label: "Video Notifications", desc: "When videos are ready, posted, or fail" },
                { key: "credits_low" as const, label: "Credit Alerts", desc: "Low balance warnings and top-up confirmations" },
                { key: "subscription_change" as const, label: "Billing & Subscription", desc: "Payment confirmations, failures, and plan changes" },
                { key: "weekly_digest" as const, label: "Weekly Summary", desc: "Weekly performance report with views, likes, and top videos" },
                { key: "autopilot_approval" as const, label: "Autopilot Notifications", desc: "Approval requests, activation, and run notifications" },
                { key: "marketing" as const, label: "Product Updates", desc: "New features, tips, and Baivid news" },
              ]).map((pref) => (
                <label
                  key={pref.key}
                  className="flex items-center justify-between rounded-lg border border-border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailPrefs[pref.key]}
                    onChange={(e) =>
                      setEmailPrefs((prev) => ({
                        ...prev,
                        [pref.key]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </label>
              ))}
              <Button
                variant="outline"
                disabled={savingPrefs}
                onClick={async () => {
                  setSavingPrefs(true);
                  await updateEmailPreferences(emailPrefs);
                  setSavingPrefs(false);
                }}
              >
                {savingPrefs ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Preferences
              </Button>
            </CardContent>
          </Card>
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
