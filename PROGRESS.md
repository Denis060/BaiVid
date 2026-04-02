# Baivid — Build Progress & Next Steps
**Last Updated:** April 2, 2026
**Domain:** baivid.com (live on Vercel)
**Repo:** github.com/Denis060/BaiVid

---

## What Was Built Today

### Core Infrastructure
- Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
- Supabase Auth (email/password + Google OAuth)
- Supabase PostgreSQL with 4 migrations (19+ tables, RLS, triggers)
- Stripe billing (checkout, portal, webhooks, 4 plans, 5 top-up packs)
- Inngest background jobs (13 functions registered)
- React Email templates (13 templates via Resend)
- AES-256-GCM token encryption for OAuth tokens
- Responsive sidebar + header with dark/light mode toggle

### Pages Built (31 total)
| Page | Status | Description |
|---|---|---|
| `/` | ✅ Complete | Landing page with hero, autopilot flow, features, pricing, testimonials, ownership badge, footer |
| `/auth/login` | ✅ Complete | Email/password + Google OAuth |
| `/auth/signup` | ✅ Complete | Full name + email/password + Google |
| `/auth/forgot-password` | ✅ Complete | Password reset flow |
| `/auth/reset-password` | ✅ Complete | New password form |
| `/dashboard` | ✅ Complete | Credits, videos, views, autopilot status, quick actions, recent videos |
| `/autopilot` | ✅ Complete | 12-step wizard + dashboard with runs history |
| `/ideas` | ✅ Complete | Gemini + Google Trends idea discovery |
| `/scripts` | ✅ Complete | Hook + Body + CTA script generator |
| `/create` | ✅ Complete | 4-mode hub (Faceless, Avatar, Audio, URL) |
| `/create/faceless` | ✅ Complete | 5-step wizard with art styles, voice, duration |
| `/create/avatar` | ✅ Complete | 5-step wizard with photo upload, voice recording |
| `/create/audio` | ✅ Complete | Audio upload + visual generation |
| `/create/url` | ✅ Complete | URL scraper + video generation |
| `/videos` | ✅ Complete | Grid view, filters, player modal, realtime updates |
| `/editor/[id]` | ✅ Complete | Timeline editor with trim, text, music, transitions |
| `/scheduler` | ✅ Complete | Video + platform + date/time scheduling |
| `/calendar` | ✅ Complete | Month/week/day views, drag-and-drop reschedule |
| `/analytics` | ✅ Complete | Recharts, platform tabs, AI insights |
| `/billing` | ✅ Complete | Plans, top-ups, auto-topup, transaction history |
| `/settings` | ✅ Complete | Email preferences, voice/connections links |
| `/settings/connections` | ✅ Complete | All 9 platforms with OAuth connect/disconnect |
| `/settings/voice` | ✅ Complete | Voice cloning + 25 AI presets |
| `/tools/thumbnails` | ✅ Complete | AI thumbnail generator (Flux.2 + Ideogram) |

### API Routes (7)
- `/api/webhooks/stripe` — Stripe webhook handler
- `/api/inngest` — 13 Inngest functions
- `/api/oauth/[platform]/connect` — OAuth initiation for 9 platforms
- `/api/oauth/[platform]/callback` — OAuth token exchange
- `/api/autopilot/approve` — Email approval with token
- `/api/autopilot/reject` — Email rejection with token
- `/auth/callback` — Supabase OAuth callback

### Inngest Background Jobs (13)
1. `faceless-video-create` — Multi-provider video pipeline
2. `avatar-video-create` — D-ID lip-sync pipeline
3. `audio-video-create` — Audio-to-video pipeline
4. `url-video-create` — URL-to-video pipeline
5. `video-rerender` — Editor re-render via FFmpeg
6. `voice-clone` — Fish Audio voice cloning
7. `autopilot-daily-cron` — 6 AM UTC, fans out to active users
8. `autopilot-run-for-user` — Full 13-step autopilot pipeline
9. `autopilot-approval-decision` — Handles approve/reject events
10. `publish-scheduled-post` — Scheduled post publishing
11. `analytics-snapshot-cron` — 4 AM UTC, fetches platform metrics
12. `email-weekly-summary` — Monday 9 AM UTC
13. `provider-free-credits-reset` — Midnight UTC, resets daily free credits

### AI Provider Routing Engine
- Video: Kling (free) → Haiper → Pika → Stock footage
- TTS: Fish Audio (free) → paid tier
- Images: Flux.2 HuggingFace (free) → Ideogram
- Scripts: Gemini Flash (free) → Grok → GPT-4o
- Cost tracking per API call with daily free limits

### Credit Costs (PRD v3.0 aligned)
| Action | Credits |
|---|---|
| Idea Discovery (10 ideas) | 5 |
| Script Generation | 1 |
| Faceless Video (per min) | 13 |
| Avatar Video (per min) | 18 |
| Audio to Video (per min) | 10 |
| URL to Video | 15 |
| Thumbnails (3 variants) | 1 |
| Video Re-render | 3 |
| Autopilot Run (daily) | 13 |
| Scheduling | 0 |

---

## What You Need To Do Next

### 1. Run Database Migrations (URGENT)
Go to **Supabase Dashboard → SQL Editor** and run these files in order:

**Already run (skip these):**
- `20240101000000_initial_schema.sql` ✅
- `20240101000001_rls_policies.sql` ✅
- `20240101000002_v3_updates.sql` — **Check if you ran this one**

**New — run this now:**
- `20240101000003_provider_routing.sql` — Creates `providers`, `provider_free_credits`, `provider_usage_log` tables with 22 seeded providers

### 2. Create Supabase Storage Buckets
Go to **Supabase Dashboard → Storage** and create these buckets:
- `videos` — for generated videos (public)
- `avatars` — for avatar photos (public)
- `voice_samples` — for voice recordings (public)
- `thumbnails` — for AI thumbnails (public)
- `music` — for background music library (public)

### 3. Get Free API Keys (Priority Order)
| Key | Where to Get | Cost | Status |
|---|---|---|---|
| `GEMINI_API_KEY` | aistudio.google.com | Free | ✅ Already set |
| `PEXELS_API_KEY` | pexels.com/api | Free | ⬜ Get now |
| `PIXABAY_API_KEY` | pixabay.com/api/docs | Free | ⬜ Get now |
| `FISH_AUDIO_API_KEY` | fish.audio | Free tier | ⬜ Get now |
| `HUGGINGFACE_API_KEY` | huggingface.co/settings/tokens | Free | ⬜ Get now |
| `KLING_API_KEY` | klingai.com | Free daily credits | ⬜ Get when ready |
| `GROK_API_KEY` | console.x.ai | Free tier | ⬜ Get when ready |
| `DID_API_KEY` | d-id.com | Trial credits | ⬜ Get when ready |
| `SERPAPI_API_KEY` | serpapi.com | 100 free/mo | ⬜ Optional |

**Do NOT get these until you have paying users:**
- `REPLICATE_API_KEY` — for Ideogram/Flux paid
- `OPENAI_API_KEY` — for GPT-4o (premium only)
- `ELEVENLABS_API_KEY` — for premium voice
- `RUNWAY_API_KEY` — for premium video
- Platform OAuth keys (YouTube, TikTok, etc.) — get when users need them

### 4. Set Up Vercel Environment Variables
Go to **Vercel Dashboard → Project Settings → Environment Variables** and add all keys from `.env.local` that you want to use in production. Critical ones:
- All Supabase keys ✅
- Stripe keys ✅
- `RESEND_API_KEY` ✅
- `GEMINI_API_KEY` ✅
- `NEXT_PUBLIC_APP_URL=https://baivid.com`
- `ENCRYPTION_KEY` — generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 5. Set Up Inngest
- Sign up at inngest.com
- Create an app, get `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`
- Add to Vercel env vars
- Set the Inngest app URL to `https://baivid.com/api/inngest`

### 6. Configure Google OAuth (for login)
- Go to Google Cloud Console → APIs & Services → Credentials
- Create OAuth 2.0 Client ID
- Set authorized redirect URI: `https://ifrinerxhutmrlwpkikl.supabase.co/auth/v1/callback`
- Add Client ID and Secret to Supabase Dashboard → Auth → Providers → Google

### 7. Set Up Stripe Products (when ready to accept payments)
Create products + prices in Stripe Dashboard:
- **Starter** — $12/mo recurring
- **Pro** — $29/mo recurring
- **Agency** — $79/mo recurring
- **Micro Top-up** — $2 one-time
- **Small Top-up** — $5 one-time
- **Standard Top-up** — $12 one-time
- **Value Top-up** — $25 one-time
- **Pro Top-up** — $60 one-time

Copy each Price ID to both `STRIPE_PRICE_ID_*` and `NEXT_PUBLIC_STRIPE_PRICE_ID_*` env vars.

Set Stripe webhook endpoint: `https://baivid.com/api/webhooks/stripe`
Events to listen for: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### 8. Configure Resend Domain
- Go to Resend Dashboard → Domains → Add `baivid.com`
- Add the DNS records Resend gives you (SPF, DKIM, etc.)
- This enables sending from `noreply@baivid.com`

---

## What To Build Tomorrow

### High Priority
1. **Test the full flow end-to-end** — signup → ideas → scripts → create video → view in library
2. **Dashboard inspiration gallery** — trending videos in user's niche (mentioned in PRD)
3. **Music library** — pre-fetch free Pixabay/Freesound tracks into Supabase Storage
4. **Caption styles with live preview** — 12 animated styles (PRD §5.3.11)

### Medium Priority
5. **Admin cost dashboard** — `/admin` page showing daily cost vs revenue per plan
6. **Series concept** — name autopilot profiles as "Series" for YouTube algorithm
7. **Bulk scheduling** — CSV upload for 500+ scheduled posts
8. **FAQ section** on landing page
9. **How It Works** section on landing page (4 animated steps)

### Nice to Have
10. **Profile photo upload** — in settings
11. **Competitive comparison table** on landing page
12. **Blog** — `/blog` for SEO
13. **Standalone /pricing** page

---

## Architecture Summary

```
baivid/
├── src/
│   ├── app/
│   │   ├── (dashboard)/     ← 19 authenticated pages
│   │   ├── auth/            ← 5 auth pages + callback
│   │   ├── api/             ← 7 API routes
│   │   └── page.tsx         ← Landing page (server-rendered)
│   ├── actions/             ← 14 server actions
│   ├── inngest/             ← 13 background functions
│   ├── lib/
│   │   ├── providers/       ← 12 AI provider clients + routers
│   │   ├── publishers/      ← 9 platform publishers
│   │   ├── supabase/        ← client, server, middleware
│   │   └── *.ts             ← stripe, gemini, did, ffmpeg, email, etc.
│   ├── components/
│   │   ├── ui/              ← 20 shadcn components
│   │   └── shared/          ← sidebar, header, navbar, providers
│   ├── emails/              ← 13 React Email templates
│   ├── stores/              ← Zustand (credits, video)
│   └── types/               ← Supabase + domain types
├── supabase/
│   ├── migrations/          ← 4 migration files
│   └── seed.sql             ← Test data
└── middleware.ts             ← Auth route protection
```

---

**Total commits today:** 30+
**Total files:** 100+ source files
**Build status:** ✅ Compiles successfully
**Live at:** baivid.com
