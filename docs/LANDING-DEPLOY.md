# BloodlinePH Landing Page — Deploy Guide

This guide walks you through deploying the landing page to **Vercel** with
email collection via **Resend**. Total cost: **$0/month** for MVP.

---

## Part 1: Set up Resend (email collection)

1. **Go to** [resend.com](https://resend.com) → Sign up (free, no credit card)
2. **Create an Audience:**
   - Left sidebar → *Audiences* → *New Audience*
   - Name it `BloodlinePH Waitlist`
   - Copy the **Audience ID** (looks like `78261eda-...`)
3. **Create an API Key:**
   - Left sidebar → *API Keys* → *Create API Key*
   - Name it `BloodlinePH Production`, permission: *Full access*
   - Copy the key (starts with `re_...`) — save it now, you can't see it again
4. (Optional) **Add your domain** for branded "from" emails:
   - *Domains* → *Add Domain* → follow DNS steps
   - Until verified, you can skip this and use `onboarding@resend.dev` as sender

---

## Part 2: Deploy to Vercel

### A) Push your repo to GitHub (if not already)

```bash
# From the project root
git add .
git commit -m "Landing page with waitlist"
git push origin master
```

### B) Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Project** → select your GitHub repo
3. **Root Directory**: set to `apps/web`
4. **Framework**: Next.js (auto-detected)
5. **Build Command**: `pnpm --filter @sabong/web build` (Vercel should auto-detect; if not, use this)
6. **Install Command**: `pnpm install`

### C) Add environment variables

In Vercel → *Project Settings* → *Environment Variables*, add:

| Name | Value | Required |
|------|-------|----------|
| `RESEND_API_KEY` | `re_...` (from step A3) | ✅ Yes |
| `RESEND_AUDIENCE_ID` | `78261eda-...` (from step A2) | ✅ Yes |
| `NOTIFY_EMAIL` | your@email.com — get notified on every signup | Optional |
| `RESEND_FROM_EMAIL` | `BloodlinePH <onboarding@resend.dev>` | Optional (default shown) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` (update after deploy) | Optional |

> **Tip:** Set them for all 3 environments (Production, Preview, Development).

### D) Deploy

Click **Deploy**. After ~2 minutes, you'll get a live URL like
`https://bloodlineph.vercel.app`.

---

## Part 3: Where to check your collected emails

After someone fills the waitlist form, you can see them in **3 places**:

1. **Resend Audience dashboard** — [resend.com/audiences](https://resend.com/audiences)
   - Shows all contacts with timestamp
   - Export to CSV any time
   - Use this list to send campaigns later
2. **Your inbox** (if you set `NOTIFY_EMAIL`) — gets an email every signup
3. **Vercel logs** — Project → Deployments → latest → Runtime Logs (fallback)

---

## Part 4: Buy a custom domain (optional)

1. Go to [namecheap.com](https://www.namecheap.com) or [porkbun.com](https://porkbun.com)
2. Search for **bloodlineph.com** (or `.ph`, `.app`, etc.)
3. Price: ~$12/year for `.com`, ~₱1,200/year for `.ph`
4. After buying → Vercel → *Project* → *Domains* → *Add*
5. Paste your domain, follow the DNS instructions (Vercel gives you the exact
   records to copy into your registrar)
6. SSL certificate auto-provisions in <1 minute

Once added, update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to the new domain.

---

## Part 5: Verify the waitlist works

1. Visit your deployed landing page
2. Scroll to the "Mobile app, parating na" section
3. Enter a test email → Click **Sumali Na**
4. Check:
   - ✅ Success message appears
   - ✅ Email arrives in your inbox (if `NOTIFY_EMAIL` set)
   - ✅ Contact appears in Resend Audience dashboard
   - ✅ Welcome email arrives at the test email

---

## Troubleshooting

**"Email didn't arrive"**
→ Resend free tier uses `onboarding@resend.dev` which may land in Gmail's
Promotions tab. Check there. Once you verify your own domain, deliverability
improves dramatically.

**"Sumali Na button spins forever"**
→ Check Vercel → Runtime Logs for errors. Most likely missing `RESEND_API_KEY`.

**"I want to stop register/login links from showing"**
→ Already done in the header — it now shows "Sumali Na" instead of "Register".
Login is kept so you can still access admin/seller accounts. If you want to
hide login entirely, edit `apps/web/src/components/layout/header.tsx`.

**"I want to switch off the full app and only show landing"**
→ Add a middleware redirect. In `apps/web/src/middleware.ts`, redirect all
non-landing routes to `/` temporarily:

```ts
// Pseudo-code — ask me to implement if you want this
if (url.pathname !== "/" && url.pathname !== "/api/waitlist") {
  return NextResponse.redirect(new URL("/", req.url));
}
```

---

## Cost Summary

| Item | Cost |
|------|------|
| Vercel hosting | **$0** (free tier, up to 100 GB bandwidth/mo) |
| Resend emails | **$0** (free: 3,000 emails/mo, unlimited contacts) |
| Domain (optional) | **$12/year** (.com) or **~₱1,200/year** (.ph) |
| **Total for MVP** | **$0 – $12/year** |

When you outgrow the free tiers:
- Vercel Pro = $20/mo (100k visitors, enterprise features)
- Resend Pro = $20/mo (50k emails)

---

## Next Steps After Launch

1. **Share the URL** — Facebook groups, messenger, word of mouth
2. **Track signups** — check Resend Audience daily
3. **Send first campaign** — when you have 100+ signups, email them a launch announcement via Resend
4. **Add Google Analytics** (optional) — paste your GA4 ID into `apps/web/src/app/layout.tsx`
5. **Buy the domain** before someone else does
