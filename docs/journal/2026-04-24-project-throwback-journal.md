# BloodlinePH (née SabongMarket) — Project Throwback Journal

**Created:** 2026-04-24
**Worktree branch:** `claude/brave-proskuriakova`
**Purpose:** Preserve every decision, pivot, feature, commit, and open thread from the long build conversation so anyone (future-you or a new engineer) can reconstruct the project's history cold.

> This document is the **single source of truth** for *why* and *in what order* things were built. Source code lives in git; architecture docs live in `docs/`; plans live in `docs/superpowers/plans/`; this journal glues it all together into narrative form.

---

## Table of Contents

1. [Origin & Rebrand](#1-origin--rebrand)
2. [Stack Audit & Gap Analysis](#2-stack-audit--gap-analysis)
3. [Landing Page & Waitlist](#3-landing-page--waitlist)
4. [Mobile App Bootstrap (Expo SDK 52 → 54)](#4-mobile-app-bootstrap-expo-sdk-52--54)
5. [Mock Trial — End-to-End Demo Readiness](#5-mock-trial--end-to-end-demo-readiness)
6. [Pitch Polish Sprints](#6-pitch-polish-sprints)
7. [Social Commerce Stack (Friends, Messaging, Reels, Groups)](#7-social-commerce-stack)
8. [Business Model: Shipping Moves to Platform](#8-business-model-shipping-moves-to-platform)
9. [Mobile Parity Sprint (Phase A–D)](#9-mobile-parity-sprint-phase-ad)
10. [Complete Commit Index (46 commits)](#10-complete-commit-index)
11. [Open Work Backlog](#11-open-work-backlog)
12. [People & Demo Accounts](#12-people--demo-accounts)
13. [Key Decisions & Rationale](#13-key-decisions--rationale)

---

## 1. Origin & Rebrand

### 1.1 What it started as (commit `d04de63`)

The project was initially scaffolded as **SabongMarket Phase 1 MVP** — a Philippine gamefowl (sabong) marketplace:

- Monorepo via pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`)
- NestJS + Drizzle ORM + PostgreSQL backend
- Next.js 15 App Router frontend
- Core features: user auth (JWT phone/password), listings, orders, messaging, reviews, favorites, sellers module

### 1.2 Competitor recon → rebrand decision

During the conversation we discovered **sabongmarket.app** — a pre-launch competitor using the same name. This triggered an immediate rebrand to **BloodlinePH**:

- Logo: red-to-gold gradient "Bloodline" text with a small "PH" chip
- Taglish-first copy ("Bumili. Magbenta. Ligtas na ngayon.")
- Commit `2acfbee` — the giant rebrand commit that also bundled the landing page + waitlist capture

### 1.3 Why "BloodlinePH"?

- "Bloodline" speaks directly to the gamefowl community (breeding lineage is everything)
- ".ph" nation-coding signals this is Pinoy-native
- Does not collide with sabongmarket.app, cockfighting.com, or any Shopee subcategory
- Short enough for domain `bloodlineph.com` (user planning to purchase)

---

## 2. Stack Audit & Gap Analysis

Before building further features, we did a deep audit of what was actually implemented vs scaffolded. Findings:

### Backend — mostly real
- ✅ All 9 modules had working CRUD (auth, users, listings, orders, sellers, favorites, messages, reviews, notifications)
- ✅ Drizzle schema + migrations up-to-date
- ⚠️ Payment processing was stubbed (no PayMongo integration yet)
- ⚠️ No image/video upload handlers (schema existed but endpoints missing)
- ⚠️ AI chat (Claude) had system prompt ready but no conversation persistence
- ⚠️ No rate limiting on any endpoint

### Frontend — pages existed, behaviors partially wired
- ✅ All major pages (home, browse, listing detail, orders, messages, settings) had routes
- ⚠️ Token refresh absent; auth redirects ad-hoc
- ⚠️ No real-time WebSocket
- ⚠️ Search returned zero results (no backend hook)
- ⚠️ Admin panel existed but sparse

### Production readiness — zero
- ❌ No tests
- ❌ No error tracking
- ❌ No deployment config
- ❌ Mobile app didn't exist

This audit drove the next ~30 commits.

---

## 3. Landing Page & Waitlist

Commit `2acfbee` (giant) shipped:

- **Premium dark + Filipino soul landing page** (`/`)
  - Aurora gradient background, glassmorphic cards
  - Phone mockup section with 4 screens
  - Taglish feature grid, live stats counters
  - Legal compliance banner ("walang betting, walang e-sabong")
  - 6 feature cards (pedigree, map, chat, escrow, verified, reels)
- **Waitlist capture** (`POST /api/waitlist`)
  - Integrates with Resend email API
  - Saves signups locally as well as via email transport
  - Env vars: `RESEND_API_KEY`, `WAITLIST_TO_EMAIL`
- **Vercel deployment config** (`apps/web/vercel.json`)
  - Root directory: `apps/web`
  - Build command navigates to monorepo root to run pnpm install
  - Multiple Vercel build retries before landing on working config (commits `7decc30`, `a2de1e6`, `8ee7c07`)

### Build failures we fixed
1. **"No Next.js version detected"** — install step didn't reach the monorepo root. Fix: `cd ../.. && pnpm install --frozen-lockfile`
2. **Regex `/s` flag error** — TypeScript target was ES2017. Fix: bump to ES2022 in `apps/web/tsconfig.json`
3. **`useSearchParams` required in Suspense** — Next.js 15 strict requirement. Fix: wrap affected pages in `<Suspense>` boundary

### Deployment state
- Landing is deployed at `bloodline-ph.vercel.app` (or similar)
- Waitlist emails arrive at the configured address
- Custom domain (`bloodlineph.com`) — user said will buy later

---

## 4. Mobile App Bootstrap (Expo SDK 52 → 54)

Mobile was added as a new workspace: `apps/mobile/`.

### 4.1 Phase 0+1 (commit `c304707`)

- Expo SDK 52 + Expo Router 6 scaffold
- pnpm monorepo wiring (metro config watches `packages/shared`)
- `.npmrc` with `node-linker=hoisted` (Expo/Metro compat)
- **Foundation libs:**
  - `theme.ts` — brand tokens matching web
  - `api.ts` — fetch wrapper with SecureStore tokens + auto-refresh on 401
  - `auth.ts` — zustand store
- **UI primitives:** Button, Input, Screen
- **App shell:** (tabs)/_layout.tsx with 5 tabs (Home, Browse, Feed, Messages, Profile)
- **Auth:** Login + Register screens

### 4.2 Phase 2 (commit `b5fa398`)

- Listings data layer (`lib/listings.ts`) with `useBrowseListings` (infinite scroll) and `useListingBySlug`
- Browse tab — search + sort + infinite scroll
- Listing detail screen (gallery, specs, CTAs)
- Featured rail on Home tab

### 4.3 Expo Web fixes (commit `7fb18cd`)

Made the Expo Web export functional:
- secure-storage fallback using localStorage when `expo-secure-store` unavailable on web
- CORS for the API to allow Expo Web origin
- Static asset paths corrected

### 4.4 Phase 3 (commit `e7f5d06`)

- Messaging (real-time via Socket.io)
- Orders flow (checkout, order list, order detail with escrow banner)
- WebSocket integration in `lib/socket.ts`

### 4.5 SDK 52 → SDK 54 upgrade (commit `710c460`)

iPhone Expo Go app is always on the latest SDK — downgrading Expo Go isn't possible on iOS, so the project bumped to SDK 54 to match the user's physical device.

Along with the upgrade:
- TikTok-style vertical video feed (`app/(tabs)/feed.tsx`)
- Hermes polyfills (`polyfills.js`) for `SharedArrayBuffer` and `String.prototype.toWellFormed`
- Custom entry (`index.js`) that loads polyfills before `expo-router/entry`
- Polished order flow

### 4.6 Hermes runtime errors we fixed

Two non-obvious bugs from ES2023+ features not in Hermes 0.81:
1. **`SharedArrayBuffer` undefined** — some RN dep checks for it at module load time. Fix: polyfill `globalThis.SharedArrayBuffer ||= ArrayBuffer`
2. **`String.prototype.toWellFormed` not a function** — WebIDL URL polyfill uses it. Fix: simple passthrough polyfill

Both live in `apps/mobile/polyfills.js`, loaded by a custom `index.js` before expo-router boots.

### 4.7 Why Expo connect via QR was painful

- iPhone Personal Hotspot isolates the Mac from the iPhone itself — `exp://` can't resolve
- ngrok tunnel (`expo start --tunnel`) failed repeatedly with "remote gone away"
- Workaround: demand real Wi-Fi for every test session, or use iOS Simulator instead

---

## 5. Mock Trial — End-to-End Demo Readiness

A 9-phase sprint to make the app demo-able for investor pitches.

### 5.1 Phases 1–2: Schema + deterministic seed (`4a04d0a`)

Seeded 6 demo users, realistic Philippine data:
- `+639171111111 · Juan dela Cruz` (admin)
- `+639172222222 · Mang Tomas Breeder` (verified seller, Pampanga, 47 sales, 4.8★)
- `+639173333333 · Kelso Farm PH / Ramon` (verified seller, Batangas)
- `+639174444444 · Sabungero Mike` (pending seller, Cavite)
- `+639175555555 · Pedro Santos` (active buyer, 4 orders pre-seeded)
- `+639176666666 · Reylyn Cruz` (new buyer)
- **All passwords:** `Demo1234!`

Plus 10 listings with real photos, 4 pre-seeded orders in varying states, sample conversations, reviews.

### 5.2 Phase 3: Backend escrow + admin (`8b5140c`)

- **Escrow state machine** — `none → held → released / refunded`
- Admin-controlled broadcast notifications
- Dispute resolution endpoints
- Seller verification approve/reject

### 5.3 Phases 4–6: Web UI for demo (`48da674`, `3b3ef92`, `cf8bb18`)

- **Buyer flow** — accept delivery / report dispute / photo evidence
- **Seller flow** — dispute visibility + review response
- **Admin panel** — verifications queue, disputes, broadcast, **demo reset** button

### 5.4 Phase 7: Social engagement (`9039a53`)

Video feed — likes, comments, follows, "shop this bird" pill.

### 5.5 Phase 8: Mobile parity for escrow (`6f8bc92`)

Mobile order detail screen gained escrow banner + Accept/Release + Dispute modal.

### 5.6 Phase 9: Docs + sign-off (`ca2177f`)

Demo rehearsal script. Plan marked complete.

### 5.7 Rooster photos (`bc0ae73`, `57c6db7`)

Two passes:
1. First pass: replace picsum placeholders with Unsplash URLs tagged "rooster"
2. Second pass: prune the pool to only verified-safe Unsplash IDs (some 404s were showing)

---

## 6. Pitch Polish Sprints

### 6.1 Tier 1 (`7cb93b2`) — 3 features

- **Live activity ticker** — "Pedro just bought a Kelso from Mang Tomas"
- **Landing counter** (waitlist count displayed in hero)
- **Release celebration** — confetti when escrow releases

### 6.2 Tiers 2+3+4 (`5e05430`) — 12 features

Bundled: seller trust score, daily streak, champion badges, quick-share, and more.

### 6.3 Seven deferred items (`f5a38c3`) — offer flow, typing, map, saved searches, i18n, AI vision, mobile video upload

The "catch-all" commit that closed seven loose threads in one go.

---

## 7. Social Commerce Stack

A multi-commit sprint building the "Facebook + TikTok + Messenger — for sabungeros" pitch. Implemented as a Task 1–15 roadmap.

### 7.1 Friends (dual social graph)

- **Schema** (`28dd893`) — `friendships` table with canonical pair (`user_a_id < user_b_id`), `status` enum (`pending/accepted/declined/blocked`), `requested_by_id`. Plus `users.friends_count` denormalized counter.
- **Backend** (`4e57310`) — `friends.service.ts` with 9 methods (send/accept/decline/remove/block/list/status/incoming/outgoing), 3 unit tests for canonical-pair helper.
- **Search + suggestions** (`0100ec5`) — `/users/search?q=` and `/users/suggestions` endpoints.
- **Web UI** (`59ea477`) — `/friends` page with 4 tabs (Friends, Requests, Sent, Discover).
- **Mobile UI** (`59ea477`) — `/friends` screen mirroring web.

### 7.2 Polymorphic Messaging

- **Schema** (`87944a6`) — `conversations` table with `type` enum (`dm/group/listing`), `chat_participants` join table, `message_reactions` table, `messages` gains `reactions` + `attachments` (JSON).
- **Service** (`1533ba2`) — Universal messaging service supporting DMs, groups, reactions.
- **Voice notes + media** (`83ed6c6`) — Multipart upload endpoint `POST /messages` with `kind: "voice"`.
- **Web UI** (`205f28c`) — Redesigned messages page: polymorphic inbox, voice waveform, reaction picker.
- **Mobile UI** (`a1afa1a`) — Matching mobile treatment.

### 7.3 Shoppable Reels

- **Schema** (`bddc81a`) — `video_listing_tags` table + click tracking.
- **Web UI** (`3a6374f`) — Shop pill overlay on reels, bottom sheet with tagged listings.
- **Mobile UI** (`a1afa1a`) — Same feature on mobile feed.

### 7.4 Bloodline Groups (Facebook-style)

- **Phase 2 Task 1** (`3c1a579`) — Full Groups feature on both web + mobile: schema, CRUD endpoints, list/detail pages, group posts, join/leave/moderate.
- 4 categories seeded: Regional (Pampanga Sabungeros, etc.), Bloodline (Kelso Nation, Sweater Society), Topic (Feeding & Nutrition), General.

### 7.5 Seed data (`1385f5f`)

Demo seed updated to include friendships, DMs, groups, and tagged reels so the pitch reel looks alive from the first session.

---

## 8. Business Model: Shipping Moves to Platform

Commit `dd2c55f` — **a major business-model change**.

### 8.1 The problem

Original model:
- Buyer paid: item price + shipping fee
- Seller payout: item price + shipping fee − 5% platform fee
- Platform: kept 5% commission

### 8.2 The change

**User insight:** BloodlinePH handles logistics end-to-end:
1. Pick up bird from seller's farm
2. Hold it at BloodlinePH's holding farm until batch is ready
3. Deliver to buyers in batch shipments

Therefore, **shipping fee should go to the platform, not the seller**.

### 8.3 New model

- Buyer pays: item + "Logistics & handling" (was "Shipping fee") + "Batch delivery fee" (was "Delivery handling")
- **Seller payout = item − 5% platform fee** (no shipping added)
- **Platform revenue = 5% commission + 100% logistics fee**

### 8.4 Files touched

- Backend: `apps/api/src/modules/orders/orders.service.ts` (payout calc + notification body)
- Web: `orders/new/page.tsx` (logistics banner + renamed fees), `orders/[id]/page.tsx` (seller payout + logistics note), `admin/orders/page.tsx` (platform revenue row)
- Mobile: `app/order/[id].tsx` + `app/order/new.tsx` (mirror all the above)

### 8.5 Verified math (Pedro's order #d38d2f3c)

| Party | Amount |
|-------|--------|
| Pedro pays (buyer) | ₱10,190 |
| Mang Tomas gets (seller) | ₱9,025 |
| BloodlinePH keeps | ₱1,075 (₱475 commission + ₱600 logistics) |

### 8.6 Taglish messaging added

Amber banner on checkout: *"Kami ang pupulutin ang manok mula sa seller, aalagaan sa aming holding farm hanggang kumpleto ang batch, saka idedeliver sa iyo nang ligtas."*

---

## 9. Mobile Parity Sprint (Phase A–D)

Audit showed mobile at **53% web feature parity** — plan is to close to 93% (everything except web-only admin/PWA features).

### 9.1 Plan documents

Four plans written using `superpowers:writing-plans` skill, saved under `docs/superpowers/plans/`:

1. `2026-04-24-mobile-phase-a-seller-flows.md` — Seller Core (~4 hrs remaining)
2. `2026-04-24-mobile-phase-b-auth-settings.md` — Auth & Settings (~7 hrs)
3. `2026-04-24-mobile-phase-c-buyer-polish.md` — Buyer Polish (~7 hrs)
4. `2026-04-24-mobile-phase-d-messaging-ai.md` — Messaging & AI (~6 hrs)

### 9.2 Phase A completed so far

- **Data layer** — `lib/listings.ts` extended with 8 new hooks (useMyListings, useCreateListing, useUpdateListing, usePublishListing, useArchiveListing, useDeleteListing, useUploadListingImages, useDeleteListingImage) + `LocalImage` interface. New `lib/sellers.ts` with 6 hooks (useMyStats, useSellerProfile, useMyPlan, useRegisterAsSeller, useUpdateSellerProfile, useSubmitSellerVerification).
- **A1 — Seller Dashboard** — `app/seller/dashboard.tsx` with welcome card, plan badge, verification banner, 4-stat grid, 2 seller-only stats, 4 action tiles.
- **A2 — My Listings** — `app/seller/listings/index.tsx` with plan-limit banner, status chips, empty state.
- **A3.1 — Form primitives** (commit `8becf7e` + fix `3e9cd4c`) — `FieldGroup.tsx` + `ImagePicker.tsx` (ImagePickerGrid).
- **A3.2 — Shared ListingForm** (commit `717ca07` + fix `b0e5d88`) — 5-section form with NaN guards and modal picker.

### 9.3 Execution mode

Using **`superpowers:subagent-driven-development`** skill — fresh implementer subagent per task + two-stage review (spec compliance, then code quality). Already caught:
- Deprecated `ImagePicker.MediaTypeOptions.Images` API (SDK 17+ uses `mediaTypes: ["images"]`)
- React key collision when user picks the same photo twice
- NaN passing through price validation when user types "abc"
- NaN being written into the payload for numeric optional fields
- Picker dropdown had no tap-away-to-close behavior

### 9.4 Remaining Phase A tasks

- A3.3 — Create Listing screen (`app/seller/listings/new.tsx`)
- A4.1 — Edit Listing screen (`app/seller/listings/[id].tsx`) with status actions (Publish/Archive/Republish/Delete)
- A5.1 — Seller Verification screen (`app/seller/verification.tsx`) with Gov ID + Farm Permit upload
- A.wrap — Wire profile nav, bundle export verify, API smoke test, push

---

## 10. Complete Commit Index

All 46 commits on `claude/brave-proskuriakova` branch (oldest → newest):

| # | SHA | Subject |
|---|-----|---------|
| 1 | `d04de63` | Initial commit: SabongMarket Phase 1 MVP scaffold |
| 2 | `2acfbee` | Rebrand to BloodlinePH with landing + waitlist + full app features |
| 3 | `67f3bff` | Merge pull request #1 from eyroooon/claude/brave-proskuriakova |
| 4 | `7decc30` | Fix Vercel install command for pnpm workspace monorepo |
| 5 | `a6cf700` | Merge remote-tracking branch 'origin/master' into claude/brave-proskuriakova |
| 6 | `a2de1e6` | Bump web tsconfig target to ES2022 for regex /s flag support |
| 7 | `8ee7c07` | Wrap pages using useSearchParams in Suspense boundaries |
| 8 | `01b5f38` | Reframe video feature as social media platform for sabungeros |
| 9 | `faafbc8` | Add test infrastructure: Jest + Vitest + Playwright with CI gating |
| 10 | `c304707` | Add mobile app (Expo + React Native) - Phase 0 + Phase 1 foundation |
| 11 | `b5fa398` | Mobile Phase 2: browse listings + detail + featured rail |
| 12 | `7fb18cd` | Mobile: make Expo web work end-to-end |
| 13 | `e7f5d06` | Mobile Phase 3: messaging + orders + real-time WebSocket |
| 14 | `710c460` | Mobile: Expo SDK 54 upgrade + TikTok Feed + polished Order flow |
| 15 | `4a04d0a` | Mock trial phase 1+2 — schema + deterministic demo seed |
| 16 | `8b5140c` | Mock trial phase 3 — backend endpoints for comments, follows, escrow, admin |
| 17 | `48da674` | Mock trial phase 4 — web buyer UI for escrow accept/dispute |
| 18 | `3b3ef92` | Mock trial phase 5 — web seller UI for dispute visibility + review response |
| 19 | `cf8bb18` | Mock trial phase 6 — admin panel for verifications, disputes, broadcast, reset |
| 20 | `9039a53` | Mock trial phase 7 — video feed social engagement |
| 21 | `6f8bc92` | Mock trial phase 8 — mobile buyer UI for escrow accept/dispute |
| 22 | `ca2177f` | Mock trial phase 9 — demo rehearsal docs + plan marked complete |
| 23 | `60973d9` | Mobile parity — real video feed, comments, follow, seller ship, reviews |
| 24 | `bc0ae73` | Swap placeholder photos for real rooster photos (Unsplash) |
| 25 | `57c6db7` | Prune rooster photo pool to only verified Unsplash IDs |
| 26 | `7cb93b2` | Pitch polish Tier 1 — live activity ticker, landing counter, release celebration |
| 27 | `5e05430` | Pitch polish Tier 2+3+4 — 12 new features for investor demo |
| 28 | `f5a38c3` | Ship the 7 deferred pitch items |
| 29 | `28dd893` | feat(social): friendships schema |
| 30 | `4e57310` | feat(social): friends backend module |
| 31 | `0100ec5` | feat(social): user search + friend suggestions |
| 32 | `87944a6` | feat(chat): polymorphic conversations + participants + reactions |
| 33 | `1533ba2` | feat(chat): universal messaging service |
| 34 | `83ed6c6` | feat(chat): voice note + chat media upload |
| 35 | `bddc81a` | feat(reels): shoppable reels — tag listings, track clicks |
| 36 | `1385f5f` | feat(demo): Phase 1 seed |
| 37 | `205f28c` | feat(web/chat): polymorphic messaging UI |
| 38 | `3a6374f` | feat(web/reels): shoppable reels UI |
| 39 | `a1afa1a` | feat(mobile): polymorphic messaging + shoppable reels UI |
| 40 | `59ea477` | feat(friends): /friends page web + /friends screen mobile |
| 41 | `3c1a579` | feat(groups): Bloodline Groups |
| 42 | `dd2c55f` | feat(orders): platform keeps logistics fee |
| 43 | `8becf7e` | feat(mobile/seller): reusable FieldGroup + ImagePickerGrid primitives |
| 44 | `3e9cd4c` | fix(mobile/seller): modernize ImagePickerGrid for expo-image-picker v17 |
| 45 | `717ca07` | feat(mobile/seller): shared ListingForm component |
| 46 | `b0e5d88` | fix(mobile/seller): ListingForm NaN guards + modal pickers |

---

## 11. Open Work Backlog

### 11.1 Phase A remaining (in active execution)

- A3.3 Create Listing screen
- A4.1 Edit Listing screen (Publish/Archive/Republish/Delete actions)
- A5.1 Seller Verification screen
- A.wrap.1 Profile nav wire
- A.wrap.2 Bundle export verify
- A.wrap.3 API smoke test against live API
- A.wrap.4 Final push to master
- Final Phase A code review

### 11.2 Phase B — Auth & Settings (not started)

- Forgot / OTP / Reset Password screens
- Settings menu + Profile edit + Change Password + Notification prefs
- Avatar upload
- Expo Push notification registration

### 11.3 Phase C — Buyer Polish (not started)

- Favorites list (replace "Coming soon" stub)
- Notifications tab
- Advanced browse filters sheet
- Seller profile on mobile (`/sellers/[id]`)
- Saved searches
- Plans + Referrals screens

### 11.4 Phase D — Messaging & AI Polish (not started)

- Voice note recording (hold-to-record with expo-av)
- Typing indicators wired fully
- Reaction picker on long-press
- AI chat support screen on mobile

### 11.5 Production & Launch

- Deploy API to Railway/Render + hosted Postgres (Neon/Supabase)
- Cloudflare R2 bucket for media storage
- Real PayMongo keys
- Custom domain `bloodlineph.com`
- Resend API key for waitlist emails (still placeholder)

### 11.6 Hardening

- Rate limiting on ALL API endpoints (only AI chat has it)
- Fix pre-existing `/feed` SSR JSON parse warning
- Sentry DSN + real error tracking
- Input sanitization (XSS hardening)
- Unit tests (zero coverage today)
- E2E tests (Playwright)
- CI/CD pipeline fully verified

### 11.7 Business Ops

- DTI / SEC business registration
- Business bank account (for PayMongo payouts)
- Real ToS + Privacy Policy (placeholder pages today)
- Customer support email
- Hire first VA

### 11.8 Content & Marketing

- Update 2 investor PPTX decks from "SabongMarket" to "BloodlinePH" (files at `docs/SabongMarket-Investor-Deck.pptx` and `docs/SabongMarket-Product-Presentation.pptx`)
- Generate Midjourney hero image/video for landing
- 4 Midjourney phone-mockup screen renders
- 60-second Runway/Kling promo video
- Facebook Messenger contact button on landing
- Update landing with real testimonial videos

---

## 12. People & Demo Accounts

| Role | Phone | Display Name | Notes |
|------|-------|--------------|-------|
| 👑 Admin | `+639171111111` | Juan dela Cruz | Demo reset button available in admin panel |
| 🏆 Seller (verified, Pro plan) | `+639172222222` | Mang Tomas Breeder | 47 sales · 4.8★ · Pampanga · Kelso |
| 🏆 Seller (verified) | `+639173333333` | Kelso Farm PH / Ramon | 23 sales · 4.9★ · Batangas |
| ⏳ Seller (pending verification) | `+639174444444` | Sabungero Mike | Cavite — unlock via admin panel |
| 🛒 Buyer (active) | `+639175555555` | Pedro Santos | 4 pre-seeded orders in escrow states |
| 🛒 Buyer (new) | `+639176666666` | Reylyn Cruz | Davao — clean slate |

**All passwords:** `Demo1234!`

---

## 13. Key Decisions & Rationale

### 13.1 Why pnpm monorepo (not Nx/Turborepo)
- pnpm workspace is simpler to reason about
- Turborepo was considered but not adopted — only `pnpm --filter` is used today
- Shared package (`packages/shared`) is pure TypeScript, no bundler needed

### 13.2 Why Drizzle (not Prisma)
- Drizzle's type inference is better
- Simpler migration story (raw SQL migration files)
- Less magic than Prisma's client generation

### 13.3 Why NestJS (not Fastify/Express)
- Decorator-based dependency injection fits the team's mental model
- Built-in guards/pipes/interceptors cover auth + validation
- Integrates cleanly with Drizzle via dynamic modules

### 13.4 Why Expo (not bare React Native)
- EAS Build ships to App Store + Play Store from CI
- `expo-router` for file-based routing
- One TS codebase reused between web and mobile via `packages/shared`

### 13.5 Why Zustand (not Redux/Context)
- Simpler API, zero boilerplate
- Works on both web and mobile without change
- Good enough for the auth state + preferences store

### 13.6 Why switch shipping to platform (commit `dd2c55f`)
- Seller user told us: BloodlinePH should handle logistics physically
- Moving the shipping fee revenue to the platform aligns incentives
- Unit economics now stronger: ~11% effective margin per order vs 5%

### 13.7 Why rebrand to BloodlinePH mid-project
- Direct competitor `sabongmarket.app` already claimed the name
- "Bloodline" is more premium, speaks to pedigree culture
- `.com` and `.ph` domains both available

### 13.8 Why SDK 54 upgrade (commit `710c460`)
- iPhone Expo Go can't downgrade to SDK 52
- Hermes runtime errors (SharedArrayBuffer) needed addressing anyway
- Side benefit: unlocked latest `expo-video`, `expo-audio`, `expo-image-picker`

### 13.9 Why Taglish in the UI
- Target audience (sabungeros) communicate in Taglish
- English-only would feel foreign; Tagalog-only too formal
- Microcopy wins: "Mag-browse Ngayon", "Sumali sa Early Access"

### 13.10 Why subagent-driven-development for Phase A
- Fresh subagent per task = no context pollution
- Two-stage review (spec compliance, then code quality) catches both missing-requirements and subtle bugs
- Already caught 4 bugs (deprecated API, key collision, NaN validation, NaN in payload) — all before reaching production

---

## Appendix — Useful Commands

### Start the API
```bash
cd /Users/aaronparducho/Developer/sabong-marketplace/.claude/worktrees/brave-proskuriakova
pnpm --filter @sabong/api start:dev
```

### Start the web
```bash
pnpm --filter @sabong/web dev
```

### Start mobile (Expo)
```bash
cd apps/mobile && pnpm start
# Scan QR with iPhone Camera → opens in Expo Go
# OR: Press 'i' for iOS Simulator
```

### Run demo seed
```bash
pnpm --filter @sabong/api run seed:demo
```

### Mobile type-check
```bash
pnpm --filter @sabong/mobile type-check
```

### Web build
```bash
pnpm --filter @sabong/shared build && pnpm --filter @sabong/web build
```

### View this journal
```bash
cat docs/journal/2026-04-24-project-throwback-journal.md
```

---

*Journal ends. Next update when Phase A wraps.*
