# API Endpoints Documentation

## Base URL
- **Development:** `http://localhost:3001/api`
- **Staging:** `https://api-staging.sabongmarket.ph/api`
- **Production:** `https://api.sabongmarket.ph/api`

## Authentication
All authenticated endpoints require a `Bearer` token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new account (phone + OTP) |
| POST | `/auth/send-otp` | No | Send OTP to phone number |
| POST | `/auth/verify-otp` | No | Verify OTP and get tokens |
| POST | `/auth/login` | No | Login with phone + password |
| POST | `/auth/login/social` | No | OAuth login (Facebook/Google) |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | Yes | Invalidate refresh token |
| POST | `/auth/forgot-password` | No | Send password reset OTP |
| POST | `/auth/reset-password` | No | Reset password with OTP |

### POST /auth/register
```json
// Request
{
  "phone": "+639171234567",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "password": "securePassword123"
}

// Response 201
{
  "message": "OTP sent to +639171234567",
  "otp_ref": "abc123"
}
```

### POST /auth/verify-otp
```json
// Request
{
  "phone": "+639171234567",
  "otp": "123456",
  "otp_ref": "abc123"
}

// Response 200
{
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG...",
  "user": {
    "id": "uuid",
    "phone": "+639171234567",
    "first_name": "Juan",
    "last_name": "Dela Cruz",
    "role": "buyer"
  }
}
```

---

## Users Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | Yes | Get current user profile |
| PATCH | `/users/me` | Yes | Update profile |
| PATCH | `/users/me/avatar` | Yes | Upload avatar |
| PATCH | `/users/me/preferences` | Yes | Update notification preferences |
| GET | `/users/:id` | No | Get public user profile |

---

## Seller Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/sellers/register` | Yes | Apply to become a seller |
| GET | `/sellers/me` | Yes (Seller) | Get own seller profile |
| PATCH | `/sellers/me` | Yes (Seller) | Update seller profile |
| GET | `/sellers/me/stats` | Yes (Seller) | Get sales analytics |
| GET | `/sellers/:id` | No | Get public seller profile |
| GET | `/sellers/:id/listings` | No | Get seller's listings |
| GET | `/sellers/:id/reviews` | No | Get seller's reviews |
| POST | `/sellers/:id/follow` | Yes | Follow a seller |
| DELETE | `/sellers/:id/follow` | Yes | Unfollow a seller |

### POST /sellers/register
```json
// Request (multipart/form-data)
{
  "farm_name": "Dela Cruz Gamefarm",
  "business_type": "individual",
  "description": "Premium Kelso and Hatch breeder since 2010",
  "farm_province": "Bulacan",
  "farm_city": "Meycauayan",
  "government_id": <file>,           // Gov ID image
  "farm_permit": <file>              // Optional farm permit
}

// Response 201
{
  "id": "uuid",
  "farm_name": "Dela Cruz Gamefarm",
  "verification_status": "pending",
  "message": "Your seller application is under review. We'll notify you within 24-48 hours."
}
```

---

## Listings Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listings` | No | Browse/search listings |
| GET | `/listings/featured` | No | Get featured listings |
| GET | `/listings/:slug` | No | Get listing details |
| POST | `/listings` | Yes (Seller) | Create new listing |
| PATCH | `/listings/:id` | Yes (Owner) | Update listing |
| DELETE | `/listings/:id` | Yes (Owner) | Delete listing |
| POST | `/listings/:id/images` | Yes (Owner) | Upload listing images |
| DELETE | `/listings/:id/images/:imageId` | Yes (Owner) | Remove listing image |
| POST | `/listings/:id/publish` | Yes (Owner) | Publish draft listing |
| POST | `/listings/:id/archive` | Yes (Owner) | Archive listing |
| POST | `/listings/:id/feature` | Yes (Owner) | Feature listing (paid) |

### GET /listings (Browse/Search)
```
GET /listings?category=rooster&breed=kelso&min_price=5000&max_price=50000&province=Bulacan&sort=newest&page=1&limit=20
```

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "title": "Premium Kelso Stag - 8 months",
      "slug": "premium-kelso-stag-8-months-abc123",
      "category": "stag",
      "breed": "Kelso",
      "bloodline": "Lemon 84",
      "age_months": 8,
      "weight_kg": 2.1,
      "price": 15000,
      "price_type": "negotiable",
      "location_province": "Bulacan",
      "location_city": "Meycauayan",
      "primary_image": "https://images.sabongmarket.ph/abc123/thumb.jpg",
      "seller": {
        "id": "uuid",
        "farm_name": "Dela Cruz Gamefarm",
        "avg_rating": 4.8,
        "is_verified": true
      },
      "view_count": 245,
      "favorite_count": 12,
      "created_at": "2025-03-15T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  },
  "filters_applied": {
    "category": "rooster",
    "breed": "kelso",
    "min_price": 5000,
    "max_price": 50000,
    "province": "Bulacan"
  }
}
```

### POST /listings (Create)
```json
// Request (multipart/form-data)
{
  "title": "Premium Kelso Stag - 8 months",
  "description": "Healthy and active Kelso stag from imported bloodline...",
  "category": "stag",
  "breed": "Kelso",
  "bloodline": "Lemon 84",
  "age_months": 8,
  "weight_kg": 2.1,
  "color": "Red",
  "leg_color": "Yellow",
  "fighting_style": "Cutter",
  "sire_info": "Imported Lemon 84 from Biboy Enriquez",
  "dam_info": "Hatch-Kelso Cross Hen",
  "price": 15000,
  "price_type": "negotiable",
  "location_province": "Bulacan",
  "location_city": "Meycauayan",
  "shipping_available": true,
  "shipping_areas": "regional",
  "shipping_fee": 500,
  "meetup_available": true,
  "images": [<file1>, <file2>, <file3>]
}

// Response 201
{
  "id": "uuid",
  "slug": "premium-kelso-stag-8-months-abc123",
  "status": "draft",
  "message": "Listing created as draft. Publish when ready."
}
```

---

## Orders Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/orders` | Yes | Get my orders (buyer/seller) |
| GET | `/orders/:id` | Yes | Get order details |
| POST | `/orders` | Yes | Create order (buy now) |
| PATCH | `/orders/:id/confirm` | Yes (Seller) | Seller confirms order |
| PATCH | `/orders/:id/ship` | Yes (Seller) | Mark as shipped + add tracking |
| PATCH | `/orders/:id/deliver` | Yes (Buyer) | Confirm delivery received |
| PATCH | `/orders/:id/complete` | Yes (Buyer) | Complete order (release escrow) |
| PATCH | `/orders/:id/cancel` | Yes | Cancel order |
| POST | `/orders/:id/dispute` | Yes (Buyer) | Open dispute |

### POST /orders
```json
// Request
{
  "listing_id": "uuid",
  "delivery_method": "shipping",
  "delivery_address": "123 Rizal St, Brgy San Jose, Meycauayan, Bulacan 3020",
  "payment_method": "gcash",
  "buyer_notes": "Please ship ASAP"
}

// Response 201
{
  "id": "uuid",
  "order_number": "SM-20250001",
  "status": "payment_pending",
  "total_amount": 15500,
  "payment": {
    "checkout_url": "https://checkout.paymongo.com/cs_abc123",
    "expires_at": "2025-03-15T09:00:00Z"
  }
}
```

### Order Status Flow
```
pending ──> payment_pending ──> paid ──> confirmed ──> shipped ──> delivered ──> completed
   │                │                                                   │
   └── cancelled <──┘                                                   └── disputed ──> resolved
```

---

## Payments Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-checkout` | Yes | Create PayMongo checkout |
| POST | `/payments/webhooks/paymongo` | No* | PayMongo webhook receiver |
| POST | `/payments/webhooks/dragonpay` | No* | Dragonpay webhook receiver |
| GET | `/payments/:orderId` | Yes | Get payment status |

*Webhook endpoints are verified using provider signatures.

---

## Messages Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/messages/conversations` | Yes | Get my conversations |
| GET | `/messages/conversations/:id` | Yes | Get messages in conversation |
| POST | `/messages/conversations` | Yes | Start new conversation |
| POST | `/messages/conversations/:id` | Yes | Send message |
| PATCH | `/messages/conversations/:id/read` | Yes | Mark conversation as read |

### WebSocket Events (Socket.io)

```typescript
// Client -> Server
socket.emit('join_conversation', { conversation_id: 'uuid' });
socket.emit('send_message', { conversation_id: 'uuid', content: 'Hello!', type: 'text' });
socket.emit('typing_start', { conversation_id: 'uuid' });
socket.emit('typing_stop', { conversation_id: 'uuid' });
socket.emit('mark_read', { conversation_id: 'uuid' });

// Server -> Client
socket.on('new_message', (message) => { ... });
socket.on('user_typing', ({ user_id, conversation_id }) => { ... });
socket.on('message_read', ({ conversation_id, read_at }) => { ... });
socket.on('notification', (notification) => { ... });
```

---

## Reviews Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reviews` | Yes | Create review (after order completed) |
| GET | `/reviews/listing/:listingId` | No | Get reviews for a listing |
| GET | `/reviews/seller/:sellerId` | No | Get reviews for a seller |
| PATCH | `/reviews/:id/respond` | Yes (Seller) | Seller responds to review |

---

## Favorites Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/favorites` | Yes | Get my favorites |
| POST | `/favorites/:listingId` | Yes | Add to favorites |
| DELETE | `/favorites/:listingId` | Yes | Remove from favorites |

---

## Notifications Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Yes | Get my notifications |
| GET | `/notifications/unread-count` | Yes | Get unread count |
| PATCH | `/notifications/:id/read` | Yes | Mark as read |
| PATCH | `/notifications/read-all` | Yes | Mark all as read |

---

## Search Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search` | No | Full-text search listings |
| GET | `/search/suggestions` | No | Search autocomplete |

### GET /search
```
GET /search?q=kelso+stag&category=rooster&min_price=5000&province=Bulacan
```

---

## Upload Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/uploads/image` | Yes | Upload single image |
| POST | `/uploads/images` | Yes | Upload multiple images (max 8) |
| DELETE | `/uploads/:key` | Yes | Delete uploaded file |

---

## Admin Endpoints (Admin role only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/dashboard` | Admin | Dashboard statistics |
| GET | `/admin/users` | Admin | List all users |
| PATCH | `/admin/users/:id/ban` | Admin | Ban/unban user |
| GET | `/admin/sellers/pending` | Admin | Pending seller verifications |
| PATCH | `/admin/sellers/:id/verify` | Admin | Approve/reject seller |
| GET | `/admin/listings/reported` | Admin | Reported listings |
| PATCH | `/admin/listings/:id/moderate` | Admin | Remove/approve listing |
| GET | `/admin/orders` | Admin | All orders |
| GET | `/admin/reports` | Admin | Moderation reports |
| PATCH | `/admin/reports/:id` | Admin | Resolve report |
| GET | `/admin/analytics` | Admin | Platform analytics |

---

## Reference Data Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | No | List all categories |
| GET | `/breeds` | No | List all breeds |
| GET | `/breeds/:id/bloodlines` | No | List bloodlines for a breed |
| GET | `/locations/provinces` | No | List Philippine provinces |
| GET | `/locations/cities/:province` | No | List cities in a province |

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    }
  ]
}
```

### Common Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Public (browse, search) | 100 requests/minute |
| Authenticated | 60 requests/minute |
| Auth (login, register, OTP) | 5 requests/minute |
| Uploads | 20 requests/minute |
| Webhooks | 200 requests/minute |
