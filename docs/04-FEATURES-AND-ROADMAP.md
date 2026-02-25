# Feature Breakdown & MVP Roadmap

## Development Phases

---

## Phase 1: MVP Core (Weeks 1-6)

**Goal:** Launch a functional marketplace where users can list, browse, and buy gamefowl.

### 1.1 Authentication & User Management (Week 1)
- [ ] OTP-based phone registration/login (primary)
- [ ] Email/password registration (secondary)
- [ ] Facebook OAuth login
- [ ] Google OAuth login
- [ ] User profile creation (name, location, avatar)
- [ ] Phone number verification via SMS
- [ ] Password reset flow
- [ ] Session management (JWT + refresh tokens)

### 1.2 Seller Onboarding (Week 1-2)
- [ ] "Become a Seller" flow
- [ ] Farm/business name setup
- [ ] Government ID upload for verification
- [ ] Farm permit upload (optional)
- [ ] Seller profile page (public-facing)
- [ ] Seller dashboard (basic stats)
- [ ] Admin verification workflow

### 1.3 Listing Management (Week 2-3)
- [ ] Create listing form with gamefowl-specific fields:
  - Title, description, category
  - Breed, bloodline, age, weight
  - Color, leg color, fighting style
  - Sire/dam info
  - Price (fixed/negotiable)
  - Location (province/city)
  - Shipping availability
- [ ] Multi-image upload (up to 8 photos)
- [ ] Image compression & thumbnail generation
- [ ] Draft/publish/archive status management
- [ ] Edit and delete listings
- [ ] Listing detail page with image gallery
- [ ] Seller's "My Listings" management page

### 1.4 Browse & Search (Week 3-4)
- [ ] Homepage with featured/recent listings
- [ ] Category browsing (Rooster, Hen, Stag, Pullet, Pair, Brood)
- [ ] Search with filters:
  - Category
  - Breed / Bloodline
  - Price range (min-max)
  - Location (province)
  - Age range
  - Weight range
- [ ] Sort by: Newest, Price (low-high, high-low), Most Popular
- [ ] Listing cards with thumbnail, price, location, seller rating
- [ ] Pagination / infinite scroll
- [ ] Meilisearch integration for instant typo-tolerant search

### 1.5 Order & Payment Flow (Week 4-5)
- [ ] "Buy Now" button → Order creation
- [ ] "Make Offer" → Price negotiation via messages
- [ ] Checkout flow:
  1. Confirm order details
  2. Select delivery method (meetup or shipping)
  3. Enter delivery address (if shipping)
  4. Select payment method
  5. Process payment via PayMongo
- [ ] Payment methods:
  - GCash
  - Maya
  - Credit/Debit Card
  - Bank Transfer
- [ ] Order confirmation page
- [ ] Order status tracking for buyer
- [ ] Order management for seller (confirm, ship, mark delivered)
- [ ] Basic escrow: hold payment → release after buyer confirms delivery

### 1.6 Messaging (Week 5-6)
- [ ] Buyer-seller chat (real-time via Socket.io)
- [ ] "Inquire" button on listing → opens chat with context
- [ ] Text and image messages
- [ ] Make Offer within chat
- [ ] Unread message count/badge
- [ ] Message notifications (push + SMS)
- [ ] Conversation list (inbox view)

### 1.7 Core Pages & Navigation (Week 6)
- [ ] Responsive mobile-first layout
- [ ] Header with search, categories, notifications, profile
- [ ] Bottom navigation (mobile): Home, Search, Sell, Messages, Profile
- [ ] Footer with links, about, contact
- [ ] 404 and error pages
- [ ] Loading states and skeleton screens
- [ ] SEO meta tags for listings

---

## Phase 2: Trust & Engagement (Weeks 7-10)

**Goal:** Build trust features and engagement tools to drive repeat usage.

### 2.1 Reviews & Ratings
- [ ] Post-purchase review (1-5 stars + comment)
- [ ] Sub-ratings: accuracy, communication, shipping
- [ ] Seller response to reviews
- [ ] Review display on listing and seller profile
- [ ] Aggregate ratings on seller cards

### 2.2 Favorites / Wishlist
- [ ] Heart/save button on listings
- [ ] "My Favorites" page
- [ ] Price drop notifications for favorited items
- [ ] Share listing (Facebook, Messenger, copy link)

### 2.3 Notifications System
- [ ] In-app notification center
- [ ] Push notifications (FCM):
  - New message received
  - Order status update
  - Payment received/released
  - Listing favorited
  - Review received
- [ ] SMS notifications for critical events (order placed, payment)
- [ ] Notification preferences (toggle per type)

### 2.4 Seller Verification Badge
- [ ] Verified seller badge display
- [ ] ID verification workflow for admins
- [ ] Tier system: New → Verified → Top Seller
- [ ] Top Seller criteria: X sales + Y rating + Z response rate

### 2.5 Reporting & Moderation
- [ ] Report listing (fake, misleading, animal welfare concern)
- [ ] Report user (scam, harassment)
- [ ] Admin moderation queue
- [ ] Auto-flag listings with suspicious patterns
- [ ] Content guidelines page

---

## Phase 3: Growth Features (Weeks 11-16)

**Goal:** Add features that differentiate the platform and drive growth.

### 3.1 Advanced Seller Tools
- [ ] Sales analytics dashboard (views, inquiries, conversion rate)
- [ ] Inventory management
- [ ] Bulk listing upload (CSV import)
- [ ] Listing templates (save & reuse)
- [ ] Promotional tools (discounts, bundle deals)
- [ ] Seller followers (users follow favorite breeders)

### 3.2 Gamefowl-Specific Features
- [ ] Breed encyclopedia / directory
- [ ] Bloodline tracker / pedigree tree visualization
- [ ] Weight class categorization
- [ ] Age calculator
- [ ] Health certificate verification system

### 3.3 Featured & Premium Listings
- [ ] "Featured" listing placement (paid)
- [ ] Homepage carousel for premium listings
- [ ] Category-specific featured spots
- [ ] Bump listing to top (paid action)
- [ ] Seller subscription plans (Breeder, Pro Breeder)

### 3.4 Auction System
- [ ] Timed auctions for premium gamefowl
- [ ] Reserve price
- [ ] Auto-bid / proxy bidding
- [ ] Auction countdown timer (real-time)
- [ ] Bidding history
- [ ] Winner notification & auto-order creation

### 3.5 Location & Delivery
- [ ] Map-based browsing (find sellers near you)
- [ ] LBC/J&T/JRS shipping integration for rate calculation
- [ ] Delivery tracking integration
- [ ] Meetup location suggestions

---

## Phase 4: Community & Scale (Weeks 17-24)

**Goal:** Build community features and prepare for scale.

### 4.1 Community Hub
- [ ] Sabong news feed / blog
- [ ] Breeder spotlight articles
- [ ] Event calendar (derbies, shows, auctions)
- [ ] Discussion forums by topic
- [ ] Facebook Group integration

### 4.2 Multi-language Support
- [ ] Filipino (Tagalog) translation
- [ ] Cebuano translation
- [ ] Language switcher
- [ ] Localized content

### 4.3 Mobile App (PWA / Native)
- [ ] Progressive Web App with offline support
- [ ] Add to Home Screen prompt
- [ ] OR: React Native mobile app (iOS + Android)

### 4.4 Platform Scaling
- [ ] Migrate to AWS infrastructure
- [ ] CDN optimization for images
- [ ] Database read replicas
- [ ] Rate limiting and abuse prevention
- [ ] Performance monitoring and optimization

### 4.5 Admin Panel
- [ ] User management (ban, suspend, verify)
- [ ] Listing moderation queue
- [ ] Financial dashboard (GMV, revenue, payouts)
- [ ] Seller payout management
- [ ] Report resolution workflow
- [ ] Content management (breeds, categories, banners)
- [ ] System configuration

---

## Development Workflow

### Sprint Structure
- **2-week sprints**
- Sprint Planning → Development → Code Review → Testing → Deploy
- Daily standups (if team)

### Git Workflow
```
main (production)
  └── develop (staging)
       ├── feature/auth-system
       ├── feature/listing-management
       ├── feature/payment-flow
       └── fix/image-upload-bug
```

### Definition of Done
- [ ] Code written and self-reviewed
- [ ] TypeScript types complete (no `any`)
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] Mobile responsive (tested on 375px, 768px, 1024px)
- [ ] Loading/error states handled
- [ ] Accessible (keyboard nav, screen reader basics)
- [ ] PR reviewed and approved
- [ ] Deployed to staging and tested
- [ ] No console errors or warnings

---

## Success Metrics (KPIs)

### MVP Launch (Month 2)
- 100+ registered users
- 50+ active listings
- 10+ completed transactions

### Month 3
- 500+ registered users
- 200+ active listings
- 50+ completed transactions/month
- 4.0+ average seller rating

### Month 6
- 2,000+ registered users
- 1,000+ active listings
- 200+ transactions/month
- PHP 500K+ monthly GMV

### Year 1
- 10,000+ registered users
- 5,000+ active listings
- 1,000+ transactions/month
- PHP 5M+ monthly GMV
- Profitability from transaction fees + premium plans
