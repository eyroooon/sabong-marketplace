# SabongMarket Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier works)
- Railway or Render account (for API + PostgreSQL)
- PayMongo account (for payments)
- Cloudflare account (for R2 storage)
- Sentry account (optional, for error tracking)

## 1. Database Setup (Railway)

1. Go to railway.app → New Project → Provision PostgreSQL
2. Copy the DATABASE_URL from Railway dashboard
3. Run migrations from local:
   ```bash
   DATABASE_URL="<your_railway_url>" pnpm db:migrate
   DATABASE_URL="<your_railway_url>" pnpm db:seed
   ```

## 2. API Deployment (Railway)

1. In Railway, create new service from GitHub repo
2. Set root directory to `/` (monorepo root)
3. Railway will auto-detect the Dockerfile via railway.json
4. Add environment variables:
   - `DATABASE_URL` (from PostgreSQL service)
   - `JWT_SECRET` (generate with `openssl rand -base64 32`)
   - `JWT_REFRESH_SECRET` (generate another)
   - `JWT_EXPIRES_IN=15m`
   - `JWT_REFRESH_EXPIRES_IN=7d`
   - `WEB_URL=https://your-vercel-app.vercel.app`
   - `ANTHROPIC_API_KEY` (your key)
   - `PAYMONGO_SECRET_KEY` (optional — enables real PayMongo; see Section 7)
   - `PAYMONGO_WEBHOOK_SECRET` (required if `PAYMONGO_SECRET_KEY` is set)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` (see Section 4)
   - `SENTRY_DSN` (optional; see Section 8)

## 3. Web Deployment (Vercel)

1. Go to vercel.com → Import Project → select your repo
2. Set root directory to `apps/web`
3. Vercel uses the vercel.json config automatically
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL=https://your-railway-api.up.railway.app/api`
   - `NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app`
   - `NEXT_PUBLIC_SENTRY_DSN` (optional; see Section 8)

## 4. Cloudflare R2 Storage Setup

SabongMarket uses Cloudflare R2 (S3-compatible) for storing uploaded images,
videos, and seller documents in production. If the R2 environment variables
below are not set, the API transparently falls back to local disk storage under
`apps/api/uploads/` (useful for local development).

### 4.1 Create the R2 bucket

1. Sign up or log in at [cloudflare.com](https://cloudflare.com).
2. In the dashboard sidebar, click **R2 Object Storage** and purchase or
   enable R2 on your account if prompted.
3. Click **Create bucket** and name it `sabongmarket` (or any name you prefer).
   Choose a region close to your users.

### 4.2 Enable public access

Uploaded files must be readable by anyone with the URL. Pick one of:

- **R2.dev subdomain (fastest to set up, for staging)**: Open your bucket,
  go to **Settings → Public Access → R2.dev subdomain → Allow Access**.
  Cloudflare will give you a URL like
  `https://pub-<hash>.r2.dev`.
- **Custom domain (recommended for production)**: Under
  **Settings → Public Access → Custom Domains**, add a domain such as
  `cdn.sabongmarket.ph` and follow the DNS instructions. Your public URL
  becomes `https://cdn.sabongmarket.ph`.

Copy the final public URL - you will need it as `R2_PUBLIC_URL`.

### 4.3 Create an API token

1. From the R2 overview page, click **Manage R2 API Tokens**.
2. Click **Create API Token**.
3. Permissions: **Object Read & Write**.
4. Scope: **Apply to specific buckets** → select `sabongmarket`.
5. Click **Create API Token** and copy:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`

### 4.4 Find your account ID

Your Cloudflare Account ID is shown on the right-hand sidebar of the R2
overview page (or at **Workers & Pages** dashboard). Copy it to
`R2_ACCOUNT_ID`.

### 4.5 Set environment variables

Add to your API service (Railway, Docker, etc.):

```
R2_ACCOUNT_ID=<your account id>
R2_ACCESS_KEY_ID=<from token step>
R2_SECRET_ACCESS_KEY=<from token step>
R2_BUCKET_NAME=sabongmarket
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

Restart the API. New uploads will be written to R2 and return absolute
`https://...` URLs. Existing local `/uploads/...` URLs continue to work
because the API still serves that directory statically.

## 5. Custom Domain (Later)

When you buy sabongmarket.ph:
- Vercel: Settings → Domains → Add sabongmarket.ph
- Railway: Settings → Networking → Custom Domain → api.sabongmarket.ph
- Update CORS_ORIGIN in API env to the new domain

## 6. Post-Deployment Checklist

- [ ] Test registration/login
- [ ] Create a test listing (verify image upload works with R2)
- [ ] Place a test order (verify PayMongo works)
- [ ] Verify AI chat works
- [ ] Check admin panel access
- [ ] Test on mobile device
- [ ] Set up Sentry alerts

## 7. PayMongo Setup

SabongMarket supports two payment modes:

- **Simulated mode (default)** — when `PAYMONGO_SECRET_KEY` is unset, the
  app shows a simulated QR / OTC reference and the "Confirm Payment" button
  marks the order paid instantly. Good for development and UX testing.
- **Real PayMongo mode** — when `PAYMONGO_SECRET_KEY` is set, GCash / Maya /
  card payments route through PayMongo. The order stays in
  `payment_pending` until a webhook confirms payment; other payment methods
  (bank transfer, OTC cash) continue to use the simulated flow.

### Sign up for PayMongo (developer/test mode)

1. Go to https://dashboard.paymongo.com/signup and create a merchant account.
2. Complete the basic business details. Full KYC is only required to accept
   live payments — **test mode works immediately**.
3. In the dashboard, use the mode toggle to switch to **Test mode**. All
   keys below come from Test mode unless noted.

### Get your secret key, public key, and webhook secret

1. Dashboard → **Developers → API keys**.
2. Copy the **Secret key** (format: `sk_test_...`) — set it as
   `PAYMONGO_SECRET_KEY` on the API (Railway).
3. Copy the **Public key** (`pk_test_...`) if you plan to tokenize cards on
   the client. Not required for the GCash/Maya redirect flow currently
   wired up.
4. For production, repeat with the **Live** keys (`sk_live_...`) once
   PayMongo has approved your KYC.

### Set up the webhook endpoint

1. Dashboard → **Developers → Webhooks → Add endpoint**.
2. URL: `https://<your-railway-api>.up.railway.app/api/orders/webhooks/paymongo`
3. Events to listen for (at minimum):
   - `source.chargeable`
   - `payment.paid`
   - `payment.failed` (recommended)
4. Save. PayMongo shows a **Webhook secret** (format: `whsec_...`) — set it
   as `PAYMONGO_WEBHOOK_SECRET` on the API.
5. Redeploy the API so it picks up the new env vars.
6. Test: from the webhook page, click **Send test event**. The API logs
   should show `PayMongo webhook event: ...`.

### Test cards and e-wallet accounts

PayMongo publishes test credentials at
https://developers.paymongo.com/docs/testing. Handy ones:

- **GCash test**: pick "Authorize test payment" on the redirect page.
- **Card (Visa success, no 3DS)**: `4343434343434345`, any future expiry,
  any CVC.
- **Card (3DS required)**: `4120000000000007`.

### Required API env vars (summary)

```
PAYMONGO_SECRET_KEY=sk_test_...       # enables real PayMongo
PAYMONGO_WEBHOOK_SECRET=whsec_...     # required to accept webhooks
```

## 8. Sentry Setup (error tracking)

Sentry is **optional** — when the DSN env vars are unset, `Sentry.init()` is
a no-op in both the API and the web app, so nothing crashes. Turning it on
takes a minute.

### Sign up and create projects

1. Go to https://sentry.io/signup/ and create a free account.
2. Create two projects under your org:
   - Platform: **Node.js (NestJS)** — e.g. `sabongmarket-api`.
   - Platform: **Next.js** — e.g. `sabongmarket-web`.
3. On each project's onboarding page, copy the DSN (format:
   `https://<public>@<ingest>.ingest.sentry.io/<id>`).

### Environment variables

**API (Railway):**

```
SENTRY_DSN=https://...                # DSN from sabongmarket-api
SENTRY_TRACES_SAMPLE_RATE=0.1         # optional, default 0.1
```

**Web (Vercel):**

```
NEXT_PUBLIC_SENTRY_DSN=https://...    # DSN from sabongmarket-web
SENTRY_TRACES_SAMPLE_RATE=0.1         # optional
```

### Source-map upload (optional but recommended)

For readable web stack traces, let Vercel upload source maps at build time:

1. Sentry → **Settings → Auth Tokens** → create a token with
   `project:releases` and `project:write` scopes.
2. On Vercel add:
   - `SENTRY_AUTH_TOKEN` = the token from step 1.
   - `SENTRY_ORG` = your Sentry org slug.
   - `SENTRY_PROJECT` = `sabongmarket-web`.
3. Redeploy. When any of these are missing, `next build` still succeeds —
   source maps just won't be uploaded.

### Verify

- Trigger a known error (e.g. call a protected API with no token, or throw
  in a route temporarily). The issue should appear in Sentry within a few
  seconds.
- Configure alerts under **Alerts → Create Alert** (e.g. email on any new
  issue in production).
