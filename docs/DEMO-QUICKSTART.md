# 🎬 BloodlinePH Demo — Quickstart

Everything you need for the mock-trial presentation on one page.

---

## 🚀 Starting the demo

```bash
# Terminal 1 — API + Postgres (use the preview script or run directly)
pnpm --filter @sabong/api dev        # NestJS on :3001

# Terminal 2 — Web
pnpm --filter @sabong/web dev        # Next.js on :3000

# Terminal 3 (optional) — Mobile
cd apps/mobile && pnpm start         # Expo, scan QR on phone
```

Landing page: <http://localhost:3000>

Reset data anytime:
- **Admin UI:** left sidebar → 🔁 "Reset demo data"
- **CLI:** `pnpm --filter @sabong/api demo:reset`

---

## 👥 Demo accounts

All passwords: **`Demo1234!`**

| Role | Phone | Name | Notes |
|------|-------|------|-------|
| Admin | `+639171111111` | Juan dela Cruz | Full admin panel |
| Seller (verified, Pro plan) | `+639172222222` | Mang Tomas Breeder | Pampanga · 47 sales · 4.8★ |
| Seller (verified, Basic plan) | `+639173333333` | Kelso Farm PH / Ramon | Batangas · 23 sales · 4.9★ |
| Seller (pending verification) | `+639174444444` | Sabungero Mike | Cavite · admin approves during demo |
| Buyer (active) | `+639175555555` | Pedro Santos | Cebu · 4 orders in every escrow state |
| Buyer (new) | `+639176666666` | Reylyn Cruz | Davao · clean slate |

---

## 📋 Data after fresh `demo:reset`

- **14 listings** (10 active + 1 reserved + 1 sold + 4 Mike drafts pending verification)
- **10 videos** (7 community + 3 marketplace-linked with Shop This Bird CTA)
- **13 comments** w/ reply threads
- **5 orders** — one in every escrow state:
  | Order | Status | Escrow | Buyer can |
  |-------|--------|--------|-----------|
  | `SM-2026000001` | pending | none | Pay now |
  | `SM-2026000002` | paid | held | — |
  | `SM-2026000003` | shipped | held | Confirm delivery / Report |
  | `SM-2026000004` | **delivered** | **held** | **✓ Accept & Release / ⚠ Report** |
  | `SM-2026000005` | completed | released | — (shows review) |
- **3 conversations** with real seeded messages
- **1 review** with seller response (temporarily cleared + restored during demo if needed)
- **5 follows** (Pedro & Reylyn already follow Tomas + Kelso Farm)
- **12 unread notifications** spread across all 6 users

---

## 🎭 9-Minute Demo Script

### Act 0 — Hook (30s)
- Open **/** → highlight waitlist + "Walang betting" banner
- Click "Mag-browse Ngayon"

### Act 1 — Buyer Discovery (90s)
- Log in as **Pedro** (`+639175555555`)
- Browse → filter by Kelso → pick "Kelso Stag — Champion bloodline"
- Show photos, verified badge, seller rating
- Click **Message Seller** → send a chat line
- Back → click **Buy Now** → pick GCash → pay → success
- Note the escrow banner: *"Ang bayad mo ay safe hanggang matanggap mo ang manok"*

### Act 2 — Seller Response (60s)
- Log out → log in as **Mang Tomas** (`+639172222222`)
- Dashboard alerts: "2 new orders" notification bell shows
- Open new order → click **Mark as Shipped** → tracking `LBC-2026-000789`
- Show order timeline update

### Act 3 — Delivery + Escrow Release (60s)
- Log back as Pedro
- Go to **Orders** → click `SM-2026000004` (delivered)
- Amber escrow banner: "Escrow: ₱9,525 held safely"
- Click **✓ Accept & Release ₱9,525** (green button)
- Banner flips to green "Payment released to seller — ₱9,525"
- All 6 status steps now checked ✓
- Review prompt appears

### Act 4 — Social Feed (90s)
- Tap **Feed** tab
- Scroll 3 vertical videos
- Tap ❤️ → heart animation, count +1
- Tap 💬 comment icon → slide-up panel opens
- Type: *"Maganda po, magkano?"* → Post
- Tap **Shop This Bird** pill → jumps to listing
- Banner at top: *"Came from Mang Tomas Breeder's video — back to Feed"*
- Back to feed → tap creator avatar's + → follow (checkmark appears)

### Act 5 — Admin Powers (90s)
- Log out → admin login (`+639171111111`)
- Dashboard shows stats
- Sidebar → **Verifications** → 1 pending (Sabungero Mike)
- Click doc images to zoom → **Approve** → counter drops to 0
- Sidebar → **Disputes** → (trigger one first: log in as Pedro → dispute SM-2026000003)
- As admin: click **Release** on the dispute → modal → Confirm
- Sidebar → **Broadcast** → compose "Weekend promo — libre featured listings!" → Audience: All users → Broadcast now
- Success banner: "Delivered to 5 users"
- Sidebar → **🔁 Reset demo data** (optional — resets state for next act)

### Act 6 — Mobile App (60s)
- Hold up iPhone / iOS Simulator
- Quick tour: Browse → listing detail
- Open an order → tap **Accept & Release** (green sticky bar)
- Same real-time sync as web

### Act 7 — AI Support (30s)
- Click 💬 chat bubble (bottom-right, anywhere)
- Ask: *"Anong bloodline para sa beginner?"*
- Claude replies in Taglish with expertise
- Rate limit badge visible ("10 messages left today")

### Closing (30s)
- Return to admin dashboard, show:
  *"In this demo: 6 users · 14 listings · 10 videos · 5 orders · ₱87k processed"*
- "All local. All live. Ready to scale."

---

## 🐞 Troubleshooting mid-demo

| Problem | Fix |
|---------|-----|
| Order buttons not showing | Reseed: admin sidebar → Reset demo data |
| Review already has seller response | Normal — the demo only clears it if you want to demo the seller-respond flow |
| Comment panel won't close | Tap the X button or outside the sheet |
| Shop This Bird pill missing | Switch feed tab to **Marketplace** — community-only videos don't link |
| Admin nav missing | Only admin role users see `/admin/**` — confirm login as `+639171111111` |
| Mobile app can't connect | Confirm API `NEXT_PUBLIC_API_URL` or mobile `.env` points to your laptop's LAN IP, not `localhost` |

---

## 📦 Shipped phases

| Phase | Status | Commit |
|-------|--------|--------|
| 1. DB schema (video_comments, follows, counters) | ✅ | `fda0edb` |
| 2. Demo seed script — 6 users + deterministic fixtures | ✅ | `fda0edb` |
| 3. Backend endpoints — comments, follows, escrow, admin | ✅ | `49872f4` |
| 4. Web buyer UI — escrow + accept/dispute | ✅ | `48da674` |
| 5. Web seller UI — dispute context + review response | ✅ | `3b3ef92` |
| 6. Web admin panel — verifications, disputes, broadcast, reset | ✅ | (see log) |
| 7. Web video feed — comments, follow, Shop This Bird | ✅ | `9039a53` |
| 8. Mobile buyer UI — escrow accept/dispute parity | ✅ | `6f8bc92` |
| 9. Polish + demo rehearsal docs | ✅ | (this commit) |

---

## 🎬 Before the presentation

- [ ] Run `pnpm --filter @sabong/api demo:reset` — fresh state
- [ ] Login as Pedro once, verify 4 orders appear
- [ ] Login as Admin once, verify 1 pending verification + 0 disputes
- [ ] Clear browser sessions so tab logs in fresh for each act
- [ ] Have iPhone charged + scanned into Expo Go if showing mobile
- [ ] Optional: record a backup screen capture in case of network hiccups
