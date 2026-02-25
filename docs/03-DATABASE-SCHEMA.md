# Database Schema Design

## Entity Relationship Overview

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Users   │────>│ SellerProfile│────>│   Listings   │
└──────────┘     └──────────────┘     └──────┬───────┘
     │                                       │
     │           ┌──────────────┐            │
     ├──────────>│   Orders     │<───────────┤
     │           └──────┬───────┘            │
     │                  │                    │
     │           ┌──────▼───────┐     ┌──────▼───────┐
     │           │  Payments    │     │ ListingImages│
     │           └──────────────┘     └──────────────┘
     │
     ├──────────>┌──────────────┐
     │           │   Reviews    │
     │           └──────────────┘
     │
     ├──────────>┌──────────────┐
     │           │   Messages   │
     │           └──────────────┘
     │
     └──────────>┌──────────────┐
                 │  Favorites   │
                 └──────────────┘
```

---

## Core Tables

### 1. users

Primary user table for all accounts (buyers, sellers, admins).

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(20) UNIQUE NOT NULL,      -- Primary auth in PH
    password_hash   VARCHAR(255),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      VARCHAR(500),
    role            VARCHAR(20) DEFAULT 'buyer',       -- buyer, seller, admin
    is_verified     BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    phone_verified  BOOLEAN DEFAULT FALSE,
    email_verified  BOOLEAN DEFAULT FALSE,

    -- Address
    region          VARCHAR(100),                       -- e.g., "Region III - Central Luzon"
    province        VARCHAR(100),                       -- e.g., "Bulacan"
    city            VARCHAR(100),                       -- e.g., "Meycauayan"
    barangay        VARCHAR(100),
    address_line    VARCHAR(255),
    zip_code        VARCHAR(10),

    -- Preferences
    language        VARCHAR(5) DEFAULT 'fil',           -- fil, en
    notification_prefs JSONB DEFAULT '{"sms": true, "push": true, "email": false}',

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 2. seller_profiles

Extended profile for users who sell gamefowl.

```sql
CREATE TABLE seller_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Business Info
    farm_name       VARCHAR(200) NOT NULL,
    business_type   VARCHAR(50),                       -- individual, registered_farm, corporation
    description     TEXT,

    -- Verification
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
    government_id_url   VARCHAR(500),                  -- Uploaded gov ID
    farm_permit_url     VARCHAR(500),                  -- Farm/business permit
    verified_at     TIMESTAMPTZ,

    -- Seller Plan
    plan            VARCHAR(20) DEFAULT 'free',        -- free, breeder, pro
    plan_expires_at TIMESTAMPTZ,

    -- Stats (denormalized for performance)
    total_sales     INTEGER DEFAULT 0,
    total_listings  INTEGER DEFAULT 0,
    avg_rating      DECIMAL(3,2) DEFAULT 0.00,
    rating_count    INTEGER DEFAULT 0,
    response_rate   DECIMAL(5,2) DEFAULT 0.00,         -- % of messages replied to
    response_time   INTEGER DEFAULT 0,                  -- Avg response time in minutes

    -- Location
    farm_region     VARCHAR(100),
    farm_province   VARCHAR(100),
    farm_city       VARCHAR(100),
    farm_barangay   VARCHAR(100),

    -- Social
    facebook_url    VARCHAR(500),
    youtube_url     VARCHAR(500),
    tiktok_url      VARCHAR(500),

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seller_profiles_user ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_status ON seller_profiles(verification_status);
CREATE INDEX idx_seller_profiles_rating ON seller_profiles(avg_rating DESC);
```

### 3. listings

Gamefowl listings — the core of the marketplace.

```sql
CREATE TABLE listings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id       UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,

    -- Basic Info
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    slug            VARCHAR(250) UNIQUE NOT NULL,

    -- Gamefowl Details
    category        VARCHAR(50) NOT NULL,              -- rooster, hen, stag, pullet, pair, brood
    breed           VARCHAR(100),                      -- e.g., "Kelso", "Hatch", "Sweater"
    bloodline       VARCHAR(200),                      -- Specific bloodline/lineage
    age_months      INTEGER,                           -- Age in months
    weight_kg       DECIMAL(4,2),                      -- Weight in kilograms
    color           VARCHAR(50),                       -- Feather color
    leg_color       VARCHAR(50),                       -- Leg color
    fighting_style  VARCHAR(100),                      -- e.g., "Cutter", "Shuffler", "Flyer"

    -- Lineage/Pedigree
    sire_info       VARCHAR(200),                      -- Father info
    dam_info        VARCHAR(200),                      -- Mother info
    pedigree_url    VARCHAR(500),                      -- Uploaded pedigree document

    -- Health
    vaccination_status  VARCHAR(50),                   -- vaccinated, not_vaccinated, partial
    health_cert_url     VARCHAR(500),                  -- Health certificate

    -- Pricing
    price           DECIMAL(10,2) NOT NULL,            -- Price in PHP
    price_type      VARCHAR(20) DEFAULT 'fixed',       -- fixed, negotiable, auction
    min_bid         DECIMAL(10,2),                     -- For auction type

    -- Status
    status          VARCHAR(20) DEFAULT 'draft',       -- draft, active, sold, reserved, archived
    is_featured     BOOLEAN DEFAULT FALSE,
    featured_until  TIMESTAMPTZ,

    -- Location
    location_province VARCHAR(100) NOT NULL,
    location_city     VARCHAR(100) NOT NULL,

    -- Shipping
    shipping_available  BOOLEAN DEFAULT FALSE,
    shipping_areas      VARCHAR(50) DEFAULT 'local',   -- local, regional, nationwide
    shipping_fee        DECIMAL(8,2),
    meetup_available    BOOLEAN DEFAULT TRUE,

    -- Stats
    view_count      INTEGER DEFAULT 0,
    inquiry_count   INTEGER DEFAULT 0,
    favorite_count  INTEGER DEFAULT 0,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    published_at    TIMESTAMPTZ
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_breed ON listings(breed);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_province ON listings(location_province);
CREATE INDEX idx_listings_featured ON listings(is_featured, featured_until);
CREATE INDEX idx_listings_created ON listings(created_at DESC);

-- Full text search index
CREATE INDEX idx_listings_search ON listings
    USING GIN(to_tsvector('english', title || ' ' || description || ' ' || COALESCE(breed, '') || ' ' || COALESCE(bloodline, '')));
```

### 4. listing_images

Multiple images per listing.

```sql
CREATE TABLE listing_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url         VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    alt_text    VARCHAR(200),
    sort_order  INTEGER DEFAULT 0,
    is_primary  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_images_listing ON listing_images(listing_id);
```

### 5. orders

```sql
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    VARCHAR(20) UNIQUE NOT NULL,        -- Human-readable: SM-20250001

    buyer_id        UUID NOT NULL REFERENCES users(id),
    seller_id       UUID NOT NULL REFERENCES seller_profiles(id),
    listing_id      UUID NOT NULL REFERENCES listings(id),

    -- Pricing
    item_price      DECIMAL(10,2) NOT NULL,
    shipping_fee    DECIMAL(8,2) DEFAULT 0,
    platform_fee    DECIMAL(10,2) NOT NULL,             -- Our commission
    total_amount    DECIMAL(10,2) NOT NULL,

    -- Status
    status          VARCHAR(30) DEFAULT 'pending',
    -- pending -> payment_pending -> paid -> confirmed -> shipped -> delivered -> completed
    -- pending -> cancelled
    -- delivered -> disputed -> resolved

    -- Delivery
    delivery_method VARCHAR(20),                        -- meetup, shipping
    delivery_address TEXT,
    tracking_number VARCHAR(100),
    shipping_provider VARCHAR(50),

    -- Dates
    paid_at         TIMESTAMPTZ,
    confirmed_at    TIMESTAMPTZ,
    shipped_at      TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,

    -- Escrow
    escrow_status   VARCHAR(20) DEFAULT 'none',        -- none, held, released, refunded
    escrow_released_at TIMESTAMPTZ,

    -- Notes
    buyer_notes     TEXT,
    seller_notes    TEXT,
    cancel_reason   TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
```

### 6. payments

```sql
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id),

    -- Payment Details
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'PHP',
    method          VARCHAR(30) NOT NULL,               -- gcash, maya, card, bank_transfer, otc_cash
    provider        VARCHAR(20) NOT NULL,               -- paymongo, dragonpay

    -- Provider References
    provider_payment_id   VARCHAR(200),                 -- PayMongo/Dragonpay reference
    provider_checkout_url VARCHAR(500),

    -- Status
    status          VARCHAR(20) DEFAULT 'pending',      -- pending, processing, paid, failed, refunded

    -- Metadata
    provider_response JSONB,                            -- Raw response from payment provider

    paid_at         TIMESTAMPTZ,
    refunded_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider_payment_id);
```

### 7. reviews

```sql
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID UNIQUE NOT NULL REFERENCES orders(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),       -- The buyer
    seller_id       UUID NOT NULL REFERENCES seller_profiles(id),
    listing_id      UUID NOT NULL REFERENCES listings(id),

    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title           VARCHAR(200),
    comment         TEXT,

    -- Specific Ratings
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    shipping_rating INTEGER CHECK (shipping_rating >= 1 AND shipping_rating <= 5),

    -- Seller Response
    seller_response TEXT,
    seller_responded_at TIMESTAMPTZ,

    is_visible      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_seller ON reviews(seller_id);
CREATE INDEX idx_reviews_listing ON reviews(listing_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### 8. conversations & messages

Buyer-seller chat system.

```sql
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID REFERENCES listings(id),
    buyer_id        UUID NOT NULL REFERENCES users(id),
    seller_id       UUID NOT NULL REFERENCES users(id),

    last_message_at TIMESTAMPTZ,
    last_message_preview VARCHAR(200),

    buyer_unread_count  INTEGER DEFAULT 0,
    seller_unread_count INTEGER DEFAULT 0,

    is_archived_buyer   BOOLEAN DEFAULT FALSE,
    is_archived_seller  BOOLEAN DEFAULT FALSE,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_conversations_unique ON conversations(listing_id, buyer_id, seller_id);
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),

    content         TEXT NOT NULL,
    message_type    VARCHAR(20) DEFAULT 'text',         -- text, image, offer, system

    -- For offer messages
    offer_amount    DECIMAL(10,2),
    offer_status    VARCHAR(20),                        -- pending, accepted, declined, expired

    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

### 9. favorites (Wishlist)

```sql
CREATE TABLE favorites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_listing ON favorites(listing_id);
```

### 10. notifications

```sql
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type        VARCHAR(50) NOT NULL,
    -- order_placed, order_confirmed, order_shipped, order_delivered
    -- payment_received, payment_released
    -- new_message, new_review, new_follower
    -- listing_featured, listing_expired
    -- price_drop (for favorited items)

    title       VARCHAR(200) NOT NULL,
    body        TEXT,
    data        JSONB,                                  -- Additional data (order_id, listing_id, etc.)

    is_read     BOOLEAN DEFAULT FALSE,
    read_at     TIMESTAMPTZ,

    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

### 11. categories & breeds (Reference Tables)

```sql
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,            -- rooster, hen, stag, pullet, pair, brood
    name_fil    VARCHAR(50),                            -- Filipino name
    slug        VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE breeds (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,            -- Kelso, Hatch, Sweater, etc.
    description TEXT,
    origin      VARCHAR(100),
    characteristics TEXT,
    image_url   VARCHAR(500),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE bloodlines (
    id          SERIAL PRIMARY KEY,
    breed_id    INTEGER REFERENCES breeds(id),
    name        VARCHAR(200) NOT NULL,
    breeder     VARCHAR(200),                            -- Original breeder/farm
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE
);
```

### 12. reports (Content Moderation)

```sql
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID NOT NULL REFERENCES users(id),

    -- What is being reported
    report_type     VARCHAR(20) NOT NULL,                -- listing, user, review, message
    listing_id      UUID REFERENCES listings(id),
    reported_user_id UUID REFERENCES users(id),
    review_id       UUID REFERENCES reviews(id),

    reason          VARCHAR(50) NOT NULL,
    -- fake_listing, misleading_info, animal_welfare, scam, harassment, spam, other

    description     TEXT,
    evidence_urls   JSONB,                               -- Screenshots, etc.

    status          VARCHAR(20) DEFAULT 'pending',       -- pending, reviewing, resolved, dismissed
    admin_notes     TEXT,
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(report_type);
```

---

## Database Considerations

### Indexing Strategy
- All foreign keys are indexed
- Composite indexes for common query patterns (seller + status, location + category)
- GIN index for full-text search on listings
- Partial indexes for active listings only

### Data Retention
- Soft deletes for listings (status = 'archived')
- Hard deletes for messages after 1 year (GDPR/Data Privacy Act compliance)
- Payment records retained for 7 years (BIR requirement)

### Scaling Strategy
1. **Read Replicas** - Route read queries for listings/search to replicas
2. **Connection Pooling** - Use PgBouncer for connection management
3. **Partitioning** - Partition orders table by year
4. **Archival** - Move completed orders older than 2 years to archive tables
