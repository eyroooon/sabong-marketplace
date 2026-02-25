# Project Folder Structure

## Monorepo Structure (Turborepo)

```
sabong-marketplace/
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   ├── images/
│   │   │   └── manifest.json         # PWA manifest
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   │   ├── (auth)/           # Auth route group
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── verify-otp/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (main)/           # Main app route group
│   │   │   │   │   ├── page.tsx                    # Homepage
│   │   │   │   │   ├── search/
│   │   │   │   │   │   └── page.tsx                # Search results
│   │   │   │   │   ├── listings/
│   │   │   │   │   │   ├── [slug]/
│   │   │   │   │   │   │   └── page.tsx            # Listing detail
│   │   │   │   │   │   └── page.tsx                # Browse listings
│   │   │   │   │   ├── categories/
│   │   │   │   │   │   └── [category]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── sellers/
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx            # Seller profile
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (dashboard)/      # Authenticated dashboard
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx                # Buyer dashboard
│   │   │   │   │   ├── sell/
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx            # Create listing
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   └── edit/
│   │   │   │   │   │   │       └── page.tsx        # Edit listing
│   │   │   │   │   │   └── page.tsx                # My listings
│   │   │   │   │   ├── orders/
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   └── page.tsx            # Order detail
│   │   │   │   │   │   └── page.tsx                # My orders
│   │   │   │   │   ├── messages/
│   │   │   │   │   │   ├── [conversationId]/
│   │   │   │   │   │   │   └── page.tsx            # Chat thread
│   │   │   │   │   │   └── page.tsx                # Inbox
│   │   │   │   │   ├── favorites/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── notifications/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   └── page.tsx                # Profile settings
│   │   │   │   │   ├── seller/
│   │   │   │   │   │   ├── setup/
│   │   │   │   │   │   │   └── page.tsx            # Become a seller
│   │   │   │   │   │   ├── analytics/
│   │   │   │   │   │   │   └── page.tsx            # Seller analytics
│   │   │   │   │   │   └── page.tsx                # Seller dashboard
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (admin)/          # Admin panel
│   │   │   │   │   ├── admin/
│   │   │   │   │   │   ├── users/
│   │   │   │   │   │   ├── listings/
│   │   │   │   │   │   ├── orders/
│   │   │   │   │   │   ├── reports/
│   │   │   │   │   │   ├── verifications/
│   │   │   │   │   │   ├── analytics/
│   │   │   │   │   │   └── page.tsx                # Admin dashboard
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── layout.tsx        # Root layout
│   │   │   │   ├── loading.tsx       # Global loading
│   │   │   │   ├── error.tsx         # Global error
│   │   │   │   ├── not-found.tsx     # 404 page
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── layout/
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   ├── footer.tsx
│   │   │   │   │   ├── mobile-nav.tsx
│   │   │   │   │   └── sidebar.tsx
│   │   │   │   ├── listings/
│   │   │   │   │   ├── listing-card.tsx
│   │   │   │   │   ├── listing-grid.tsx
│   │   │   │   │   ├── listing-form.tsx
│   │   │   │   │   ├── listing-gallery.tsx
│   │   │   │   │   ├── listing-filters.tsx
│   │   │   │   │   └── listing-search.tsx
│   │   │   │   ├── orders/
│   │   │   │   │   ├── order-card.tsx
│   │   │   │   │   ├── order-status.tsx
│   │   │   │   │   └── checkout-form.tsx
│   │   │   │   ├── chat/
│   │   │   │   │   ├── chat-window.tsx
│   │   │   │   │   ├── message-bubble.tsx
│   │   │   │   │   └── conversation-list.tsx
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login-form.tsx
│   │   │   │   │   ├── register-form.tsx
│   │   │   │   │   └── otp-input.tsx
│   │   │   │   └── shared/
│   │   │   │       ├── image-upload.tsx
│   │   │   │       ├── rating-stars.tsx
│   │   │   │       ├── price-display.tsx
│   │   │   │       ├── location-picker.tsx
│   │   │   │       └── empty-state.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts
│   │   │   │   ├── use-socket.ts
│   │   │   │   ├── use-notifications.ts
│   │   │   │   ├── use-debounce.ts
│   │   │   │   └── use-infinite-scroll.ts
│   │   │   ├── lib/
│   │   │   │   ├── trpc.ts           # tRPC client setup
│   │   │   │   ├── auth.ts           # Auth.js config
│   │   │   │   ├── utils.ts          # Utility functions
│   │   │   │   └── constants.ts      # App constants
│   │   │   ├── stores/
│   │   │   │   ├── auth-store.ts     # Zustand auth store
│   │   │   │   ├── cart-store.ts
│   │   │   │   └── notification-store.ts
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # NestJS Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── strategies/
│       │   │   │   │   ├── jwt.strategy.ts
│       │   │   │   │   └── local.strategy.ts
│       │   │   │   ├── guards/
│       │   │   │   │   ├── jwt-auth.guard.ts
│       │   │   │   │   └── roles.guard.ts
│       │   │   │   └── dto/
│       │   │   │       ├── login.dto.ts
│       │   │   │       ├── register.dto.ts
│       │   │   │       └── verify-otp.dto.ts
│       │   │   ├── users/
│       │   │   │   ├── users.module.ts
│       │   │   │   ├── users.controller.ts
│       │   │   │   ├── users.service.ts
│       │   │   │   └── dto/
│       │   │   ├── sellers/
│       │   │   │   ├── sellers.module.ts
│       │   │   │   ├── sellers.controller.ts
│       │   │   │   ├── sellers.service.ts
│       │   │   │   └── dto/
│       │   │   ├── listings/
│       │   │   │   ├── listings.module.ts
│       │   │   │   ├── listings.controller.ts
│       │   │   │   ├── listings.service.ts
│       │   │   │   └── dto/
│       │   │   │       ├── create-listing.dto.ts
│       │   │   │       ├── update-listing.dto.ts
│       │   │   │       └── listing-filters.dto.ts
│       │   │   ├── orders/
│       │   │   │   ├── orders.module.ts
│       │   │   │   ├── orders.controller.ts
│       │   │   │   ├── orders.service.ts
│       │   │   │   └── dto/
│       │   │   ├── payments/
│       │   │   │   ├── payments.module.ts
│       │   │   │   ├── payments.controller.ts
│       │   │   │   ├── payments.service.ts
│       │   │   │   ├── providers/
│       │   │   │   │   ├── paymongo.provider.ts
│       │   │   │   │   └── dragonpay.provider.ts
│       │   │   │   └── webhooks/
│       │   │   │       ├── paymongo.webhook.ts
│       │   │   │       └── dragonpay.webhook.ts
│       │   │   ├── messages/
│       │   │   │   ├── messages.module.ts
│       │   │   │   ├── messages.gateway.ts       # Socket.io gateway
│       │   │   │   ├── messages.controller.ts
│       │   │   │   └── messages.service.ts
│       │   │   ├── reviews/
│       │   │   │   ├── reviews.module.ts
│       │   │   │   ├── reviews.controller.ts
│       │   │   │   └── reviews.service.ts
│       │   │   ├── notifications/
│       │   │   │   ├── notifications.module.ts
│       │   │   │   ├── notifications.controller.ts
│       │   │   │   ├── notifications.service.ts
│       │   │   │   └── providers/
│       │   │   │       ├── fcm.provider.ts
│       │   │   │       ├── sms.provider.ts
│       │   │   │       └── email.provider.ts
│       │   │   ├── search/
│       │   │   │   ├── search.module.ts
│       │   │   │   ├── search.controller.ts
│       │   │   │   └── search.service.ts         # Meilisearch integration
│       │   │   ├── uploads/
│       │   │   │   ├── uploads.module.ts
│       │   │   │   ├── uploads.controller.ts
│       │   │   │   └── uploads.service.ts        # Cloudflare R2 integration
│       │   │   └── admin/
│       │   │       ├── admin.module.ts
│       │   │       ├── admin.controller.ts
│       │   │       └── admin.service.ts
│       │   ├── database/
│       │   │   ├── schema/                       # Drizzle schema
│       │   │   │   ├── users.ts
│       │   │   │   ├── sellers.ts
│       │   │   │   ├── listings.ts
│       │   │   │   ├── orders.ts
│       │   │   │   ├── payments.ts
│       │   │   │   ├── messages.ts
│       │   │   │   ├── reviews.ts
│       │   │   │   ├── notifications.ts
│       │   │   │   ├── categories.ts
│       │   │   │   └── index.ts                  # Export all schemas
│       │   │   ├── migrations/                   # Drizzle migrations
│       │   │   ├── seed/
│       │   │   │   ├── categories.seed.ts
│       │   │   │   ├── breeds.seed.ts
│       │   │   │   └── index.ts
│       │   │   └── database.module.ts
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   │   ├── current-user.decorator.ts
│       │   │   │   └── roles.decorator.ts
│       │   │   ├── filters/
│       │   │   │   └── http-exception.filter.ts
│       │   │   ├── interceptors/
│       │   │   │   └── transform.interceptor.ts
│       │   │   ├── pipes/
│       │   │   │   └── validation.pipe.ts
│       │   │   └── types/
│       │   │       └── index.ts
│       │   ├── config/
│       │   │   ├── app.config.ts
│       │   │   ├── database.config.ts
│       │   │   ├── redis.config.ts
│       │   │   ├── payment.config.ts
│       │   │   └── storage.config.ts
│       │   ├── trpc/
│       │   │   ├── trpc.module.ts
│       │   │   ├── trpc.router.ts                # Root tRPC router
│       │   │   └── trpc.service.ts
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/
│       │   ├── auth.e2e-spec.ts
│       │   ├── listings.e2e-spec.ts
│       │   └── orders.e2e-spec.ts
│       ├── nest-cli.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                         # Shared packages
│   ├── shared/                       # Shared types & validation
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── user.types.ts
│   │   │   │   ├── listing.types.ts
│   │   │   │   ├── order.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── validators/
│   │   │   │   ├── listing.validator.ts
│   │   │   │   ├── order.validator.ts
│   │   │   │   └── index.ts
│   │   │   ├── constants/
│   │   │   │   ├── categories.ts
│   │   │   │   ├── breeds.ts
│   │   │   │   ├── provinces.ts       # Philippine provinces
│   │   │   │   └── index.ts
│   │   │   └── utils/
│   │   │       ├── currency.ts        # PHP formatting
│   │   │       ├── slug.ts
│   │   │       └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── ui/                           # Shared UI (if needed later)
│   │   └── package.json
│   │
│   └── config/                       # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── docker/
│   ├── docker-compose.yml            # Local dev (PostgreSQL, Redis, Meilisearch)
│   ├── Dockerfile.api
│   └── Dockerfile.web
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, type-check, test
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── docs/                             # Project documentation
│   ├── 01-PROJECT-OVERVIEW.md
│   ├── 02-TECH-STACK.md
│   ├── 03-DATABASE-SCHEMA.md
│   ├── 04-FEATURES-AND-ROADMAP.md
│   ├── 05-PROJECT-STRUCTURE.md
│   └── 06-API-ENDPOINTS.md
│
├── turbo.json                        # Turborepo config
├── package.json                      # Root workspace
├── pnpm-workspace.yaml
├── .env.example
├── .gitignore
└── CLAUDE.md                         # AI assistant context
```

---

## Key Architectural Decisions

### Why Monorepo (Turborepo)?
- **Shared types** between frontend and backend (no drift)
- **Single PR** for full-stack features
- **Shared validation** (Zod schemas used in both frontend forms and backend API)
- **Consistent tooling** (ESLint, TypeScript, Prettier configs)
- **Faster CI** with Turborepo caching

### Why App Router (Next.js)?
- Route groups `(auth)`, `(main)`, `(dashboard)` for layout separation
- Server Components for listing pages (SEO + performance)
- Server Actions for form submissions
- Parallel routes for modal-based flows (e.g., login modal)

### Why NestJS over plain Express?
- Dependency injection = easier testing
- Modular architecture scales with team size
- Built-in support for WebSockets (Socket.io gateway)
- Guards + decorators for clean auth/role patterns
- Aligns with enterprise patterns as the team grows
