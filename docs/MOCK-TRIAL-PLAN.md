# 🎬 BloodlinePH Mock Trial — Implementation Plan

> **Status:** ✅ **ALL 9 PHASES SHIPPED.** See [DEMO-QUICKSTART.md](./DEMO-QUICKSTART.md) for the presentation script + troubleshooting cheat sheet.

> **Goal:** Build a complete, locally-hosted end-to-end demo where every flow is fully wired — buyer journey with escrow, seller operations, admin oversight, video feed with comments/likes/follows, and click-through from feed to marketplace. All data persists on this Mac. Nothing external required.

---

## 1. Demo Users (seeded)

All passwords: `Demo1234!`

| ID | Role | Name | Phone | State |
|----|------|------|-------|-------|
| U1 | **Admin** | Juan dela Cruz | `+639171111111` | Active |
| U2 | **Seller (verified)** | Mang Tomas Breeder | `+639172222222` | Verified, 4.8★, 47 sales |
| U3 | **Seller (verified)** | Kelso Farm PH | `+639173333333` | Verified, 4.9★, 23 sales |
| U4 | **Seller (pending)** | Sabungero Mike | `+639174444444` | Docs submitted, awaiting admin review |
| U5 | **Buyer (active)** | Pedro Santos | `+639175555555` | Has order history + reviews |
| U6 | **Buyer (new)** | Reylyn Cruz | `+639176666666` | First-time buyer, clean slate |

---

## 2. Full Feature Wire-Up Matrix

### ✅ = Works now   🔧 = Needs wiring for mock trial   ➕ = New feature to build

| # | Feature | Web | Mobile | Admin |
|---|---------|-----|--------|-------|
| 1 | Login/register all 6 users | ✅ | ✅ | ✅ |
| 2 | Browse + search listings | ✅ | ✅ | — |
| 3 | Listing detail + photos | ✅ | ✅ | — |
| 4 | Add to favorites | ✅ | ✅ | — |
| 5 | Message seller (real-time WS) | ✅ | ✅ | — |
| 6 | Buy now → order create | ✅ | ✅ | — |
| 7 | Simulated PayMongo checkout | ✅ | ✅ | — |
| 8 | **Escrow hold on payment** | 🔧 | 🔧 | ✅ |
| 9 | Seller marks "Ready to Ship" | 🔧 | 🔧 | — |
| 10 | Seller marks "Shipped" + tracking | 🔧 | 🔧 | — |
| 11 | Buyer marks "Received" → Accept/Report | ➕ | ➕ | — |
| 12 | Escrow auto-release on accept | ➕ | — | ✅ |
| 13 | Admin dispute resolution | ➕ | — | ➕ |
| 14 | Buyer writes review | ✅ | ➕ | — |
| 15 | Seller responds to review | ✅ | ➕ | — |
| 16 | Video feed (vertical scroll) | ✅ | ✅ | — |
| 17 | Like video | ✅ | ➕ | — |
| 18 | **Comment on video** | ➕ | ➕ | — |
| 19 | **Reply to comment** | ➕ | ➕ | — |
| 20 | **Follow creator** | ➕ | ➕ | — |
| 21 | **"Shop This Bird" link → listing** | ➕ | ➕ | — |
| 22 | Share video (copy link) | ➕ | ➕ | — |
| 23 | Upload video (local disk) | ✅ | ➕ | — |
| 24 | AI chat support (Claude) | ✅ | ➕ | — |
| 25 | Notification bell + live push | ✅ | ➕ | — |
| 26 | **Admin broadcast notifications** | ➕ | receive only | ➕ |
| 27 | **Admin verify sellers** | ➕ | — | ➕ |
| 28 | Admin manage orders (force status) | 🔧 | — | ➕ |
| 29 | Admin moderate listings/videos | 🔧 | — | ➕ |
| 30 | **Admin dispute/escrow panel** | ➕ | — | ➕ |
| 31 | Admin suspend/reactivate user | 🔧 | — | 🔧 |
| 32 | **Demo reset button** (re-seed) | ➕ | — | ➕ |

**Legend totals:**
- ✅ Already working: 14
- 🔧 Needs wiring: 7
- ➕ New to build: 18

---

## 3. Detailed Flow Specifications

### 🛒 Flow A: Complete Buyer Journey with Escrow

```
1.  Pedro browses → finds Kelso Stag listing (₱12,000) from Mang Tomas
2.  Pedro clicks "Message Seller" → "Available pa po ba? Kailan pwede ship?"
3.  Mang Tomas replies via real-time WS → "Oo sir, pwede ship bukas"
4.  Pedro returns to listing → clicks "Buy Now"
5.  Checkout screen:
    - Delivery address (pre-filled from profile)
    - Payment method radio (GCash | Maya | Bank Transfer | COD)
    - Platform fee (5%) shown separately
    - Escrow notice: "Ang bayad mo ay mase-safe-hold hanggang matanggap mo ang manok"
6.  Pedro selects GCash → clicks "Pay ₱12,600"
7.  Simulated PayMongo redirect → 2-second "processing" → success
8.  Order status: pending → payment_pending → paid
9.  Escrow status: none → held ← NEW ✨
10. Mang Tomas receives notification: "New paid order #SM-2026-000012 — ₱12,000"
11. Mang Tomas opens order → clicks "Ready to Ship"
12. Order status: paid → confirmed
13. Pedro notified: "Seller confirmed — preparing your order"
14. Mang Tomas enters tracking #: LBC-123456 → clicks "Mark as Shipped"
15. Order status: confirmed → shipped
16. Pedro notified: "Your order is on the way — Tracking LBC-123456"
17. [Time passes — admin can fast-forward via "Simulate Delivery" button]
18. Order status: shipped → delivered (auto or admin-forced)
19. Pedro notified: "Natanggap mo na ba ang manok? Pakikumpirma."
20. Pedro clicks notification → order screen shows:
    [ ✓ Accept & Release Payment ]  [ ⚠️ Report Problem ]
21a. Pedro clicks ACCEPT:
     - Escrow status: held → released
     - Payment transferred to seller (simulated — just status change)
     - Order status: delivered → completed
     - Mang Tomas notified: "Payment released — ₱12,000"
     - Mang Tomas stats update: totalSales +1, rating prompt
     - Pedro sees "Leave a review" prompt
21b. Pedro clicks REPORT:
     - Dispute dialog: reason dropdown + photos upload
     - Escrow status: held → disputed
     - Admin notified: "Dispute on order #SM-2026-000012"
     - Order moves to admin dispute queue
     - Admin reviews → Release OR Refund
```

**Notification triggers along the way:**
- Order placed → seller
- Payment received → seller
- Seller confirmed → buyer
- Order shipped → buyer
- Delivery reminder → buyer (24h after shipped)
- Payment released → seller
- Dispute opened → admin
- Dispute resolved → both parties

---

### 🎥 Flow B: Video Feed Social Experience

```
User opens Feed tab:
┌────────────────────────┐
│   [VIDEO PLAYS]        │
│                        │
│  @MangTomas ✓          │  ← verified badge
│  "Champion Kelso Stag  │
│   for sale — 7 months" │
│                        │
│  [🛍️ Shop This Bird]  │  ← links to listing
│  [❤️ 234]  [💬 18]    │  ← engagement
│  [👤+ Follow]  [↗️]   │  ← follow + share
└────────────────────────┘
    swipe up ↑

Tap ❤️ → heart animation, count +1, DB persisted
Tap 💬 → slide-up comment panel:
  ┌──────────────────────┐
  │ Comments (18)        │
  ├──────────────────────┤
  │ @Pedro: Maganda! Mag-│
  │ kano po?        ❤ 2 │
  │   ↳ @Mang: PM ko po  │
  │ @Reylyn: Bloodline?  │
  │ ...                  │
  │ [Type a comment...]  │
  └──────────────────────┘

Tap 🛍️ "Shop This Bird":
  → Navigate to /listings/kelso-stag-champion-2026
  → Full listing page opens
  → Can add to favorites, message, buy now
  → "Came from @MangTomas video" badge at top

Tap creator avatar:
  → Seller profile page
  → Shows: bio, verified badge, stats
  → Tabs: Videos | Listings | Reviews
  → [Follow] button at top

Tap 👤+ Follow:
  → Count increments on creator's profile
  → Creator gets notification: "Pedro followed you"
  → Following appears in buyer's "Following" list
  → Their new videos boost in buyer's feed

Tap ↗️ Share:
  → Sheet: Copy Link | Send to Chat | More
  → Link copied: bloodlineph.com/feed/v/abc123
  → Recipient opens → sees the same video
```

**New database tables needed:**
- `video_comments` (id, videoId, userId, parentId, content, createdAt)
- `follows` (followerId, followingId, createdAt)

**API endpoints to add:**
- `POST /videos/:id/comments`
- `GET /videos/:id/comments`
- `DELETE /comments/:id`
- `POST /users/:id/follow`
- `DELETE /users/:id/follow`
- `GET /users/:id/followers`
- `GET /users/:id/following`
- `GET /feed` (personalized: following + trending)

---

### 👑 Flow C: Admin Control Panel

```
Admin logs in → sees 6-card dashboard:
┌─────────────────────────────────────────┐
│ Pending Verifications    ▸ [3]          │
│ Active Disputes          ▸ [2]          │
│ Flagged Content          ▸ [5]          │
│ Today's Revenue          ₱24,500        │
│ New Users (24h)          12             │
│ System Health            All green ✓    │
└─────────────────────────────────────────┘

Click "Pending Verifications":
  → Queue with 3 sellers awaiting approval
  → Each shows: avatar, name, farm location, submitted docs
  → Click → full detail view:
    - Government ID photo (clickable zoom)
    - Farm permit photo (clickable zoom)
    - Business info form
    - [✓ Approve] [✗ Reject with reason]
  → On Approve:
    - seller.verificationStatus = "verified"
    - Verified badge appears on profile + listings
    - Seller gets notification: "Congratulations! You're verified"

Click "Active Disputes":
  → List of escrow-disputed orders
  → Each shows: buyer, seller, amount, reason, photos
  → Click → full dispute view:
    - Order timeline
    - Dispute details + buyer's photos
    - Chat log between buyer/seller
    - [Release to Seller] [Refund Buyer] [Request More Info]

Click "Broadcast Notification":
  → Form:
    [Subject]: ____________
    [Message]: ____________
    [Audience]: ⦿ All users
                ○ Buyers only
                ○ Sellers only
                ○ Verified sellers
                ○ Specific user (search)
    [Send Now]
  → WebSocket pushes to all matching clients
  → Every user's bell badge updates instantly

Click "Users":
  → Table: avatar, name, role, joined, status
  → Row actions: View | Suspend | Reset password
  → Click View → full profile + activity log

Click "Demo Reset" (bottom-right):
  → Confirm dialog
  → Runs seed script
  → Wipes all demo data, restores clean state
  → Admin stays logged in
```

---

## 4. Seed Data Spec

### Listings (20 total)
| # | Breed | Price | Seller | Photos | Status |
|---|-------|-------|--------|--------|--------|
| 1–5 | Kelso Stag/Pullet | ₱8k–₱15k | Mang Tomas | 3–5 each | active |
| 6–10 | Sweater/Hatch Cross | ₱6k–₱12k | Kelso Farm | 3–5 each | active |
| 11–13 | Asil / Shamo | ₱15k–₱25k | Mang Tomas | 3–5 each | featured |
| 14 | Kelso Stag (reserved) | ₱10k | Mang Tomas | 3 | reserved |
| 15 | Sweater Stag (sold) | ₱9k | Kelso Farm | 3 | sold |
| 16–20 | Mixed | ₱3.5k–₱7k | Sabungero Mike | 2–3 each | draft (pending verification) |

**Photo source:** Download 60 rooster photos from Pexels/Unsplash (royalty-free), store in `apps/api/uploads/listings/`. I'll curate by breed.

### Videos (10 total)
| # | Creator | Caption | Linked Listing |
|---|---------|---------|----------------|
| 1 | Mang Tomas | "Champion Kelso Stag — 7 months, training done" | #3 |
| 2 | Mang Tomas | "Farm tour — 200+ birds sa likod" | — |
| 3 | Kelso Farm | "Bagong delivery: 12 Sweater stags" | #7 |
| 4 | Kelso Farm | "Bloodline talk: Paano kilalanin ang pure Kelso" | — |
| 5 | Mang Tomas | "Training routine — Day 30" | — |
| 6 | Mang Tomas | "Meet the champion — 'Bagsak-Presyo'" | #11 |
| 7 | Kelso Farm | "Sparring session ngayong umaga" | — |
| 8 | Mang Tomas | "Feeding schedule for peak condition" | — |
| 9 | Kelso Farm | "Asil import — fresh from Thailand" | #12 |
| 10 | Mang Tomas | "Q&A — Common newbie mistakes" | — |

**Video source options (you decide):**
- **A)** Placeholder videos with text overlay "Demo: [Creator] Farm" — safest, 2 hr to make
- **B)** Stock footage (Pexels video library — free farm/nature clips) — 1 hr to curate
- **C)** AI-generated with Kling/Runway — best but costs $$

### Orders (5 pre-loaded states)
| # | Buyer | Seller | Listing | Status | Escrow |
|---|-------|--------|---------|--------|--------|
| O1 | Pedro | Mang Tomas | Kelso Stag | pending_payment | — |
| O2 | Pedro | Mang Tomas | Kelso Pullet | paid | held |
| O3 | Pedro | Kelso Farm | Sweater Cross | shipped (LBC-789) | held |
| O4 | Pedro | Mang Tomas | Sweater Stag | delivered (awaiting accept) | held |
| O5 | Reylyn | Kelso Farm | Kelso Stag | completed | released |

### Conversations (4 threads)
| Thread | Buyer | Seller | Context |
|--------|-------|--------|---------|
| C1 | Pedro | Mang Tomas | Asking about Kelso training |
| C2 | Pedro | Kelso Farm | Shipping to Cebu — coordination |
| C3 | Reylyn | Mang Tomas | Counter-offer ₱8k on ₱10k listing |
| C4 | Pedro | Kelso Farm | Dispute — bird not as described |

### Reviews (10)
- 8 positive (4–5★) — Mang Tomas mostly
- 2 mixed (3★) — Kelso Farm (shows the review response feature)

### Video Comments (pre-seed 3–6 per video)
- Mix of Pedro, Reylyn, and random usernames
- Including threads with replies

### Follows (pre-seed)
- Pedro follows Mang Tomas, Kelso Farm
- Reylyn follows Mang Tomas
- (so new users have pre-populated "Following" feed)

### Notifications (per-user pre-populated)
- Pedro: 3 unread (order shipped, message, review reminder)
- Mang Tomas: 5 unread (2 new orders, comment on video, follow, message)
- Kelso Farm: 2 unread (review reminder, comment)
- Admin: 8 unread (3 verifications, 2 disputes, 3 flagged items)

---

## 5. Implementation Phases

> I'll execute these in order, committing at the end of each phase. Each phase is independently testable.

### **Phase 1: Database foundation** (1.5 hr)
- Add schema: `video_comments`, `follows`
- Add schema fields: `users.followersCount`, `users.followingCount`, `videos.commentsCount`, `videos.sharesCount`
- Generate + run migration

### **Phase 2: Demo seed script** (2 hr)
- `apps/api/src/database/seed-demo.ts`
- Create all 6 users with correct roles/verification states
- Download + store 60 listing photos + 10 videos
- Create listings, orders, conversations, reviews, follows, comments, notifications
- CLI: `pnpm --filter @sabong/api seed:demo`
- Admin "Demo Reset" button calls the same script

### **Phase 3: Backend wire-ups** (3 hr)
- Video comments API (CRUD + counts)
- Follow/unfollow API
- Order flow endpoints:
  - `POST /orders/:id/accept-delivery` (buyer → releases escrow)
  - `POST /orders/:id/report-issue` (buyer → opens dispute)
  - `POST /admin/disputes/:id/resolve` (admin → release or refund)
- Admin endpoints:
  - `GET /admin/verifications/pending`
  - `POST /admin/verifications/:id/approve`
  - `POST /admin/verifications/:id/reject`
  - `POST /admin/broadcast` (WS push)
  - `POST /admin/users/:id/suspend`
- Wire notification triggers on all new events

### **Phase 4: Web UI — Buyer flow** (2.5 hr)
- Checkout: add escrow info badge + explainer
- Order detail: new states + Accept/Report buttons
- Dispute dialog with photo upload
- Review prompt after accept
- Notification bell live updates

### **Phase 5: Web UI — Seller flow** (1.5 hr)
- Order detail seller view: Ready-to-Ship + Tracking input
- Stats live update on completion
- Response to review UI

### **Phase 6: Web UI — Admin panel** (3 hr)
- Dashboard 6-card layout (live counts)
- Verification queue with doc viewer
- Dispute resolution panel
- Broadcast form with WS push
- User management table
- Demo reset button

### **Phase 7: Web UI — Video feed engagement** (2.5 hr)
- Comment panel (slide-up sheet)
- Reply threads
- Follow button on creator
- "Shop This Bird" CTA → listing page
- Share sheet
- Live like animation

### **Phase 8: Mobile UI parity** (4 hr)
- Match all new features on iOS/Android
- Order status actions (Accept/Report)
- Video feed comments + follow + shop link
- Notification bell

### **Phase 9: Polish + rehearsal** (1.5 hr)
- Pre-fetch demo images to avoid loading delays during pitch
- Add loading states that feel instant
- Verify all flows end-to-end
- Record backup video in case of live demo issues
- Test Demo Reset button

**Total estimate: ~22 hours.** Can be compressed by working in parallel on different layers.

---

## 6. Demo Script (9-minute pitch)

### Act 0 — Hook (30s)
- Show the BloodlinePH landing page
- "32,451 sabungeros already joined waitlist" (live counter)
- Click "Mag-browse Ngayon"

### Act 1 — Buyer Discovery (90s)
- Browse → filter Kelso → pick a listing
- Show photos, verified badge, seller rating
- Click Message Seller → quick chat
- Click Buy Now → checkout
- **Highlight escrow badge**: *"Ang bayad mo ay safe hanggang matanggap mo"*
- Select GCash → pay → success
- Notification rings: *"Order placed"*

### Act 2 — Seller Response (60s)
- Log out → log in as Mang Tomas
- Dashboard alerts: "2 new orders"
- Open new order → mark as shipped → tracking #
- Show order timeline animation updating

### Act 3 — Delivery + Escrow Release (60s)
- Log back as Pedro
- Order shows "Delivered — please confirm"
- Click **Accept & Release Payment**
- Watch escrow badge flip: held → released
- Animation: *"₱12,000 released to Mang Tomas"*
- Review prompt appears

### Act 4 — Social Feed (90s)
- Switch to Feed tab
- Scroll through 3 vertical videos
- Tap heart on one
- Tap comment → type *"Maganda po, magkano?"*
- Tap **Shop This Bird** → instant navigation to listing
- "Came from @MangTomas" badge at top
- Back to feed → follow creator

### Act 5 — Admin Powers (90s)
- Log out → admin login
- Dashboard: 3 verifications, 2 disputes
- Click verification → view docs → **Approve**
- Sabungero Mike instantly notified (show on 2nd screen/phone)
- Click Broadcast → *"Weekend promo — featured listings libre!"*
- All 5 users' bells chirp simultaneously
- Open dispute → release funds → resolved

### Act 6 — Mobile App (60s)
- Hold up iPhone OR iOS Simulator
- Quick browse + messaging demo
- Same auth, same data, live sync

### Act 7 — AI Support (30s)
- Chat bubble → *"Anong bloodline para sa beginner?"*
- Claude responds in Taglish with expertise
- Rate limit badge visible

### Closing (30s)
- Back to admin dashboard
- Show: *"In this demo: 6 users, 20 listings, 10 videos, 5 orders, ₱87k processed"*
- "All local. All live. Ready to scale."

---

## 7. Open Decisions — Defaults I'm Applying (override if you disagree)

| Q | Default Choice |
|---|----------------|
| **Video sources** | Option A — Placeholder videos with text overlay (safest, fast). Can swap for real later. |
| **Demo reset** | Option C — Both admin button AND CLI script |
| **Mobile demo** | Option B — iOS Simulator (works offline, no WiFi dependency) |
| **Priority** | Option B — Equal web + mobile (but web gets the first polish pass) |

---

## 8. What I'll Deliver

When complete, you'll have:

1. **One command to reset everything**: `pnpm demo:reset`
2. **Six ready-to-use accounts** with known passwords
3. **Every flow working end-to-end** — buyer, seller, admin, social
4. **Real data everywhere** — no fake placeholders, no "coming soon" signs
5. **Backup screen recording** if live demo misbehaves
6. **Mobile app testable** on iOS Simulator (plus on real device if WiFi solved)
7. **Demo script PDF** (this file converted) for your pocket reference

---

## 9. Approval Needed

Reply "**go**" and I'll start Phase 1 now. Reply with any changes to the defaults or scope and I'll adjust before starting.
