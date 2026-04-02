import Link from "next/link";
import type { Metadata } from "next";
import {
  Video,
  Lightbulb,
  FileText,
  User,
  Calendar,
  BarChart3,
  Globe,
  TrendingUp,
  Sparkles,
  Send,
  Check,
  Star,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Shield,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { LandingNav } from "@/components/shared/landing-nav";

export const metadata: Metadata = {
  title: "Baivid — AI Video Creation on Autopilot",
  description:
    "Set it once, go viral every day. Create AI-powered faceless and avatar videos, auto-publish to 9 platforms, and grow your audience with Baivid.",
  openGraph: {
    title: "Baivid — AI Video Creation on Autopilot",
    description:
      "Set it once, go viral every day. Create AI-powered faceless and avatar videos, auto-publish to 9 platforms.",
    type: "website",
    url: "https://baivid.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Baivid — AI Video Creation on Autopilot",
    description: "Set it once, go viral every day.",
  },
};

const FEATURES = [
  { icon: Lightbulb, title: "Trending Ideas", desc: "AI discovers viral topics in your niche using real-time Google Trends data and Gemini analysis." },
  { icon: FileText, title: "Smart Scripts", desc: "Generate hook-body-CTA scripts optimized for any platform — YouTube, TikTok, Instagram, and more." },
  { icon: User, title: "Avatar Videos", desc: "Create talking-head videos with AI lip-sync. Upload a photo, clone your voice, go live." },
  { icon: Calendar, title: "Auto Scheduler", desc: "Schedule and auto-publish to 9 platforms. Drag-and-drop calendar with color-coded events." },
  { icon: BarChart3, title: "Analytics", desc: "Track views, likes, and followers across all platforms. AI-powered insights suggest your next move." },
  { icon: Globe, title: "Multi-Platform", desc: "YouTube, TikTok, Instagram, Facebook, LinkedIn, Pinterest, Twitter/X, Reddit, and Threads — all connected." },
];

const PLANS = [
  { name: "Free", price: 0, features: ["50 credits/month", "Faceless videos", "720p export", "Baivid watermark"], cta: "Start Free", popular: false },
  { name: "Starter", price: 12, features: ["500 credits/month", "Faceless + Avatar", "1080p export", "No watermark", "5 scheduled posts"], cta: "Get Started", popular: false },
  { name: "Pro", price: 29, features: ["1,500 credits/month", "All video types", "4K export", "Autopilot mode", "Unlimited scheduling", "Priority support"], cta: "Go Pro", popular: true },
  { name: "Agency", price: 79, features: ["5,000 credits/month", "All video types", "4K export", "Autopilot mode", "Unlimited scheduling", "API access", "Team collaboration"], cta: "Contact Sales", popular: false },
];

const TESTIMONIALS = [
  { name: "Sarah Chen", role: "Content Creator, 120K followers", quote: "Baivid's Autopilot changed everything. I went from posting twice a week to daily — and my engagement tripled.", avatar: "SC" },
  { name: "Marcus Johnson", role: "Digital Marketing Agency", quote: "We manage 15 client channels. Baivid saves us 40+ hours a week on video production. The ROI is insane.", avatar: "MJ" },
  { name: "Priya Sharma", role: "EdTech Startup Founder", quote: "The AI scripts are surprisingly good. We use Baivid for all our educational content — it captures complex ideas clearly.", avatar: "PS" },
];

const AUTOPILOT_STEPS = [
  { step: 1, icon: TrendingUp, label: "Trend", desc: "AI finds trending topics in your niche" },
  { step: 2, icon: Sparkles, label: "Script", desc: "Generates hook + body + CTA script" },
  { step: 3, icon: Video, label: "Video", desc: "Creates faceless or avatar video" },
  { step: 4, icon: Send, label: "Publish", desc: "Auto-posts to all your platforms" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-32 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Video Creation
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Set it once.{" "}
            <span className="text-primary">Go viral every day.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Create AI-powered faceless and avatar videos, auto-publish to 9
            platforms, and grow your audience — all on autopilot.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start for Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#autopilot"
              className="inline-flex items-center justify-center rounded-lg border border-border px-8 py-3 text-base font-semibold hover:bg-accent transition-colors"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required &middot; 50 free credits
          </p>
        </div>
      </section>

      {/* Autopilot */}
      <section id="autopilot" className="py-20 sm:py-28 bg-muted/30 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-4">
              <Video className="h-3.5 w-3.5" />
              The Autopilot Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              From trending topic to published video.{" "}
              <span className="text-primary">Automatically.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Baivid&apos;s Autopilot runs daily — discovering trends, writing
              scripts, generating videos, and publishing across all your
              platforms.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUTOPILOT_STEPS.map((s) => (
              <div key={s.step} className="relative rounded-xl border border-border bg-card p-6 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {s.step}
                </div>
                <s.icon className="mx-auto h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-1">{s.label}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">Connects with 9+ platforms</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {["YouTube", "TikTok", "Instagram", "Facebook", "LinkedIn", "Pinterest", "Twitter/X", "Reddit", "Threads"].map((p) => (
                <span key={p} className="text-xs rounded-full border border-border px-3 py-1 text-muted-foreground">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to create <span className="text-primary">viral content</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">One platform. Every tool. No more juggling 10 different apps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors">
                <f.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-muted/30 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              How it works: <span className="text-primary">4 simple steps</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">From discovering ideas to publishing across all platforms.</p>
          </div>

          {/* Desktop: Horizontal layout */}
          <div className="hidden sm:grid sm:grid-cols-4 gap-6 mb-12">
            {[
              {
                step: 1,
                icon: Lightbulb,
                title: "Discover Ideas",
                desc: "Enter your niche. Baivid finds trending topics using Google Trends + AI analysis. Pick the ones with highest virality scores."
              },
              {
                step: 2,
                icon: FileText,
                title: "Generate Script",
                desc: "One click turns any idea into a hook-body-CTA script. Choose tone, duration, and style — AI handles the rest."
              },
              {
                step: 3,
                icon: Video,
                title: "Create Video",
                desc: "Pick faceless or avatar mode. Select art style and voice. Baivid generates scenes, voiceover, and captions automatically."
              },
              {
                step: 4,
                icon: Send,
                title: "Publish Everywhere",
                desc: "Schedule or publish instantly to YouTube, TikTok, Instagram, and 6 more platforms. Track performance from one dashboard."
              }
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="rounded-xl border border-border bg-card p-6 text-center h-full flex flex-col">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground mx-auto mb-4">
                    {item.step}
                  </div>
                  <item.icon className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground flex-grow">{item.desc}</p>
                </div>
                {item.step < 4 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-primary/50" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: Vertical timeline */}
          <div className="sm:hidden space-y-6">
            {[
              {
                step: 1,
                icon: Lightbulb,
                title: "Discover Ideas",
                desc: "Enter your niche. Baivid finds trending topics using Google Trends + AI analysis. Pick the ones with highest virality scores."
              },
              {
                step: 2,
                icon: FileText,
                title: "Generate Script",
                desc: "One click turns any idea into a hook-body-CTA script. Choose tone, duration, and style — AI handles the rest."
              },
              {
                step: 3,
                icon: Video,
                title: "Create Video",
                desc: "Pick faceless or avatar mode. Select art style and voice. Baivid generates scenes, voiceover, and captions automatically."
              },
              {
                step: 4,
                icon: Send,
                title: "Publish Everywhere",
                desc: "Schedule or publish instantly to YouTube, TikTok, Instagram, and 6 more platforms. Track performance from one dashboard."
              }
            ].map((item, idx) => (
              <div key={item.step} className="relative">
                {idx < 3 && (
                  <div className="absolute left-5 top-16 h-12 w-0.5 bg-primary/30" />
                )}
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground flex-shrink-0 relative z-10">
                    {item.step}
                  </div>
                  <div className="flex-grow pb-6">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ownership Badge */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-4">
            <Check className="h-3.5 w-3.5" />
            Content Ownership
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            You own 100% of everything you create
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Unlike other platforms that claim copyright on AI-generated content,
            Baivid&apos;s terms guarantee full ownership of every video, script,
            and thumbnail you create. Always.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="py-20 sm:py-28 bg-muted/30 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Compare Baivid to the <span className="text-primary">competition</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">See why creators choose Baivid over Syllaby and ShortVidCast.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold text-sm">Feature</th>
                  <th className="text-center p-4 font-semibold text-sm bg-primary/10">
                    <div className="font-bold text-base">Baivid</div>
                  </th>
                  <th className="text-center p-4 font-semibold text-sm">Syllaby.io</th>
                  <th className="text-center p-4 font-semibold text-sm">ShortVidCast</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Starting Price",
                    baivid: "$12/mo",
                    syllaby: "$49/mo",
                    shortvidcast: "$29/mo",
                    baividWins: true
                  },
                  {
                    feature: "Free Plan",
                    baivid: "Yes (50 credits)",
                    syllaby: "No",
                    shortvidcast: "Limited",
                    baividWins: true
                  },
                  {
                    feature: "Autopilot Mode",
                    baivid: "Yes (daily)",
                    syllaby: "Manual only",
                    shortvidcast: "No",
                    baividWins: true
                  },
                  {
                    feature: "Platforms Supported",
                    baivid: "9",
                    syllaby: "4",
                    shortvidcast: "3",
                    baividWins: true
                  },
                  {
                    feature: "Avatar Videos",
                    baivid: "Yes",
                    syllaby: "Yes",
                    shortvidcast: "No",
                    baividWins: false
                  },
                  {
                    feature: "Content Ownership",
                    baivid: "100% yours",
                    syllaby: "They claim rights",
                    shortvidcast: "Shared",
                    baividWins: true
                  },
                  {
                    feature: "Email After Every Post",
                    baivid: "Yes",
                    syllaby: "No",
                    shortvidcast: "No",
                    baividWins: true
                  },
                  {
                    feature: "African Voices & Art",
                    baivid: "Yes",
                    syllaby: "No",
                    shortvidcast: "No",
                    baividWins: true
                  },
                  {
                    feature: "Credit Top-ups",
                    baivid: "From $2",
                    syllaby: "Not available",
                    shortvidcast: "$10 minimum",
                    baividWins: true
                  }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium text-sm">{row.feature}</td>
                    <td className="p-4 text-center text-sm bg-primary/10">
                      <div className="font-semibold">{row.baivid}</div>
                      {row.baividWins && (
                        <Check className="h-4 w-4 text-green-600 mx-auto mt-1" />
                      )}
                    </td>
                    <td className="p-4 text-center text-sm">
                      <div>{row.syllaby}</div>
                      {row.feature !== "Avatar Videos" && row.feature !== "Content Ownership" && row.feature !== "Email After Every Post" && row.feature !== "African Voices & Art" && row.feature !== "Credit Top-ups" ? null : (
                        <span className="text-red-600 text-xl">✕</span>
                      )}
                    </td>
                    <td className="p-4 text-center text-sm">
                      <div>{row.shortvidcast}</div>
                      {row.feature !== "Avatar Videos" && row.feature !== "Platforms Supported" ? null : (
                        <span className="text-red-600 text-xl">✕</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-muted/30 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Upgrade when you&apos;re ready to scale.
              <span className="block mt-1 text-sm text-primary font-medium">
                3x cheaper than Syllaby on every action.
              </span>
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`relative rounded-xl border bg-card p-6 ${plan.popular ? "border-primary ring-2 ring-primary shadow-lg" : "border-border"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most Popular</span>
                  </div>
                )}
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <><span className="text-3xl font-bold">${plan.price}</span><span className="text-muted-foreground">/month</span></>
                  )}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={`block text-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:bg-accent"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* 7-Day Guarantee */}
          <div className="mt-12 rounded-xl border border-primary/30 bg-primary/5 p-6 flex items-center gap-4 text-center sm:text-left">
            <Shield className="h-8 w-8 text-primary flex-shrink-0 mx-auto sm:mx-0" />
            <div className="flex-grow">
              <h3 className="font-semibold text-lg text-foreground">7-Day Money-Back Guarantee</h3>
              <p className="text-sm text-muted-foreground mt-1">Try any paid plan risk-free. If you&apos;re not satisfied within 7 days, we&apos;ll refund every penny. No questions asked.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28 bg-muted/30 scroll-mt-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">Everything you need to know about Baivid.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "What is Baivid?",
                a: "Baivid is an AI-powered video creation platform that helps creators discover trending ideas, generate scripts, create faceless or avatar videos, and publish to 9 social platforms — all from one dashboard. Our Autopilot feature can create and post a video every single day, automatically."
              },
              {
                q: "How does Autopilot work?",
                a: "Set your niche, pick your platforms, choose your video style, and activate. Every day, Baivid discovers trending topics, writes a script, generates a video with AI visuals and voiceover, and publishes to all your connected platforms. You can require approval before posting or let it run fully automatically."
              },
              {
                q: "Do I own my videos?",
                a: "Yes, always. 100% of everything you create on Baivid belongs to you. Unlike some competitors, we never claim copyright or licensing rights on your content. You can download, repost, sell, or do anything you want with your videos."
              },
              {
                q: "What platforms can I publish to?",
                a: "YouTube, TikTok, Instagram, Facebook, LinkedIn, Pinterest, Twitter/X, Reddit, and Threads — 9 platforms total. Connect each one via OAuth and publish from a single dashboard."
              },
              {
                q: "How much does a video cost?",
                a: "A 1-minute faceless video costs 13 credits (~$0.31 on the Starter plan). Avatar videos cost 18 credits per minute. With the Pro plan at $29/month for 1,500 credits, that's roughly 115 faceless videos per month."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. All plans are month-to-month with no contracts. Cancel anytime from your billing dashboard. Plus, every paid plan comes with a 7-day money-back guarantee."
              },
              {
                q: "What makes Baivid different from Syllaby?",
                a: "Three things: price (we start at $12/mo vs $49/mo), true daily Autopilot (Syllaby requires manual steps), and content ownership (Syllaby's terms claim rights to your content — we never do)."
              },
              {
                q: "Is there an API?",
                a: "API access is available on the Agency plan ($79/month). It includes all video creation endpoints, scheduling, and analytics. Contact us for documentation."
              }
            ].map((item, idx) => (
              <details key={idx} className="group rounded-lg border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/30">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-foreground hover:bg-muted/50 transition-colors">
                  <span>{item.q}</span>
                  <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground border-t border-border pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-28 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Loved by creators worldwide</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Start creating for free today</h2>
          <p className="mt-4 text-lg text-muted-foreground">50 free credits. No credit card required. Start making viral videos in minutes.</p>
          <div className="mt-8">
            <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Get Started — It&apos;s Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid sm:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <Video className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold">Baivid</span>
              </div>
              <p className="text-sm text-muted-foreground">AI video creation on autopilot.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#autopilot" className="hover:text-foreground">Autopilot</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Baivid. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground"><MessageCircle className="h-4 w-4" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
