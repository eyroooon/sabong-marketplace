# Tech Stack Documentation

## Recommended Stack (2025-2026)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Mobile-First)                  │
│         Next.js 15 + TypeScript + Tailwind + shadcn/ui   │
│                   Deployed on Vercel                      │
└──────────────────────┬──────────────────────────────────┘
                       │ tRPC (type-safe)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    API LAYER                              │
│              NestJS + TypeScript + tRPC                   │
│              Deployed on Railway / AWS ECS                │
├─────────────┬────────────┬──────────┬───────────────────┤
│  Auth       │  Payments  │  Search  │  Real-time        │
│  NextAuth   │  PayMongo  │  Meili   │  Socket.io        │
│  + OTP      │  Dragonpay │  search  │  + Redis          │
└──────┬──────┴─────┬──────┴────┬─────┴────────┬──────────┘
       │            │           │              │
       ▼            ▼           ▼              ▼
┌────────────┐ ┌─────────┐ ┌────────┐  ┌───────────────┐
│ PostgreSQL │ │ Redis   │ │ Meili  │  │ Cloudflare R2 │
│ (Primary)  │ │ (Cache) │ │ Search │  │ (Images/CDN)  │
└────────────┘ └─────────┘ └────────┘  └───────────────┘
```

---

## Stack Breakdown

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.x (App Router) | React framework with SSR/SSG/ISR |
| **TypeScript** | 5.x | Type safety across the entire stack |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **shadcn/ui** | latest | Accessible, customizable UI components |
| **React Hook Form** | 7.x | Form handling with validation |
| **Zod** | 3.x | Schema validation (shared with backend) |
| **Zustand** | 5.x | Lightweight client state management |
| **TanStack Query** | 5.x | Server state management & caching |
| **next-intl** | latest | i18n for Filipino/English language support |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **NestJS** | 11.x | Enterprise Node.js framework |
| **TypeScript** | 5.x | End-to-end type safety |
| **tRPC** | 11.x | Type-safe API layer (frontend ↔ backend) |
| **Drizzle ORM** | latest | SQL-first TypeScript ORM |
| **Zod** | 3.x | Input validation & schema definition |
| **Bull MQ** | 5.x | Job queues (emails, notifications, image processing) |

### Database & Cache

| Technology | Purpose | Hosting |
|-----------|---------|---------|
| **PostgreSQL 16** | Primary database | Railway / Supabase / AWS RDS |
| **Redis 7** | Caching, sessions, pub/sub, queues | Railway / Upstash |

### Authentication

| Technology | Purpose |
|-----------|---------|
| **Auth.js (NextAuth) v5** | OAuth, credentials, session management |
| **Semaphore / Twilio** | OTP via SMS (primary auth in PH) |
| **Google/Facebook OAuth** | Social login options |

### Payments

| Provider | Coverage |
|---------|----------|
| **PayMongo** (Primary) | Credit/Debit Cards, GCash, Maya, GrabPay, BPI, UnionBank, QR Ph |
| **Dragonpay** (Secondary) | Over-the-counter cash (7-Eleven, SM, Bayad Center) |

### Search

| Technology | Purpose |
|-----------|---------|
| **Meilisearch** | Full-text search with typo tolerance, faceted filtering, instant results |

### Real-Time

| Technology | Purpose |
|-----------|---------|
| **Socket.io** + Redis adapter | Buyer-seller chat messaging |
| **Firebase Cloud Messaging** | Push notifications (Android/iOS) |

### File Storage & CDN

| Technology | Purpose |
|-----------|---------|
| **Cloudflare R2** | Object storage (zero egress fees) |
| **Cloudflare Images** | Image transformations & CDN delivery |

### DevOps & Monitoring

| Technology | Purpose |
|-----------|---------|
| **Vercel** | Frontend hosting (Singapore edge) |
| **Railway** | Backend, DB, Redis hosting (MVP) |
| **GitHub Actions** | CI/CD pipeline |
| **Sentry** | Error tracking & performance monitoring |
| **Better Stack** | Logging & uptime monitoring |
| **Docker** | Local development & containerization |

---

## Estimated Monthly Costs

### MVP Phase (0-1,000 users)

| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 |
| Railway (Backend + PostgreSQL + Redis) | $15-30 |
| Meilisearch Cloud (or self-hosted) | $0-30 |
| Cloudflare R2 + Images | $5-15 |
| Semaphore SMS (OTP) | $10-30 |
| Sentry (Free tier) | $0 |
| Domain + SSL | $1-2 |
| **Total** | **~$50-130/month** |

### Growth Phase (1,000-10,000 users)

| Service | Monthly Cost |
|---------|-------------|
| Vercel Pro | $20 |
| Railway / AWS | $50-150 |
| Meilisearch Cloud | $30-60 |
| Cloudflare R2 + Images | $20-50 |
| Semaphore SMS | $50-100 |
| Sentry Team | $26 |
| **Total** | **~$200-400/month** |

### Scale Phase (10,000+ users)

Migrate to AWS infrastructure: ~$500-2,000/month depending on traffic.

---

## Why This Stack?

1. **Full TypeScript** - One language across frontend, backend, and database schemas. Fewer bugs, faster development.
2. **Mobile-First Performance** - Next.js RSC + Tailwind + Cloudflare CDN = fast loads even on slow PH networks.
3. **PH Payment Coverage** - PayMongo + Dragonpay covers 95%+ of Filipino payment methods.
4. **Cost-Effective MVP** - Start at ~$50/month and scale infrastructure as revenue grows.
5. **Developer Ecosystem** - React/Next.js has the largest developer pool in the Philippines for hiring.
6. **Production-Ready Security** - Row-level security, JWT/session auth, input validation with Zod.
