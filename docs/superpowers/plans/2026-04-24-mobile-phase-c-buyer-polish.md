# Mobile Phase C: Buyer Polish — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every remaining buyer-side gap vs web: favorites list, notifications tab, advanced browse filters, seller profile on mobile, saved searches, plans & referrals.

**Architecture:** Six new mobile screens + two new lib files. All hit existing API endpoints already used by the web. Reuses existing React-Native and react-query patterns established in Phase A.

**Tech Stack:** Expo Router 6, @tanstack/react-query 5, @react-native-community/slider (for price range).

---

## File Structure

```
apps/mobile/
├── app/
│   ├── favorites.tsx                # C1 (new)
│   ├── notifications.tsx            # C2 (new)
│   ├── sellers/
│   │   └── [id].tsx                 # C4 (new)
│   ├── saved-searches.tsx           # C5 (new)
│   ├── plans.tsx                    # C6 (new)
│   └── referrals.tsx                # C6 (new)
├── components/
│   └── browse/
│       └── FiltersSheet.tsx         # C3 (new) — bottom sheet modal
└── lib/
    ├── favorites.ts                 # C1 (new)
    ├── notifications.ts             # C2 (new)
    └── saved-searches.ts            # C5 (new)
```

---

## Task C1: Favorites list

**Files:**
- Create: `apps/mobile/lib/favorites.ts`
- Create: `apps/mobile/app/favorites.tsx`
- Modify: `apps/mobile/app/(tabs)/profile.tsx` — replace "Coming soon" stub with real navigation to `/favorites`

**Lib hooks:**
```ts
export function useMyFavorites() {
  return useQuery<{ data: Listing[] }, Error>({
    queryKey: ["favorites", "my"],
    queryFn: () => apiGet<{ data: Listing[] }>("/favorites"),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation<{ favorited: boolean }, Error, { listingId: string }>({
    mutationFn: ({ listingId }) =>
      apiPost<{ favorited: boolean }>(`/favorites/${listingId}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}
```

**Screen:** FlatList with same ListingCard component used on Browse tab + empty state with link to `/browse`.

---

## Task C2: Notifications tab

**Files:**
- Create: `apps/mobile/lib/notifications.ts`
- Create: `apps/mobile/app/notifications.tsx`
- Modify: `apps/mobile/app/_layout.tsx` or the notification bell component to link to this route.

**Lib hooks:**
```ts
export function useNotifications(page = 1) {
  return useQuery<{ data: Notification[]; pagination: Pagination }, Error>({
    queryKey: ["notifications", page],
    queryFn: () => apiGet<...>(`/notifications?page=${page}&limit=20`),
  });
}

export function useUnreadCount() {
  return useQuery<{ unread: number }, Error>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiGet<{ unread: number }>("/notifications/unread-count"),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, { id: string }>({
    mutationFn: ({ id }) =>
      apiPost<{ ok: true }>(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, void>({
    mutationFn: () => apiPost<{ ok: true }>("/notifications/mark-all-read", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
```

**Screen:** FlatList of notifications with icon based on type, timestamp, title, body. Tap → mark-read + deep-link (e.g. `order_paid` → `/order/[id]`, `new_message` → `/messages/[id]`). Header right: "Mark all read" button.

---

## Task C3: Advanced browse filters

**Files:**
- Create: `apps/mobile/components/browse/FiltersSheet.tsx`
- Modify: `apps/mobile/app/(tabs)/browse.tsx` — add "Filters" icon button in header that opens the sheet.

**Sheet contents (bottom modal):**
- Category picker (chip selector of CATEGORIES)
- Breed picker (dropdown of BREEDS)
- Price range: `@react-native-community/slider` with two thumbs (or two sliders for min/max)
- Province picker
- Verified sellers only — toggle
- Sort: Newest / Price low→high / Price high→low / Most popular
- Actions: Reset · Apply

Emits full `BrowseFilters` object to parent, which pushes into `useBrowseListings`. When filters change, the browse FlatList reloads.

---

## Task C4: Seller profile on mobile

**Files:**
- Create: `apps/mobile/app/sellers/[id].tsx`

**Sections:**
1. Header with avatar, farm name, verified ✓ badge, location
2. Stats row: total sales · average rating · member since
3. Social links (Facebook, YouTube, TikTok) if available
4. "Active Listings" grid reusing ListingCard
5. "Recent Reviews" section (reuse review hooks from `lib/reviews.ts`)

**Fix:** in `apps/mobile/app/friends/index.tsx` and `apps/mobile/app/listing/[slug].tsx`, uncomment the previously-stubbed `onPressCard`/seller-avatar taps and point them at `/sellers/${user.id}` or `/sellers/${listing.seller.userId}`.

---

## Task C5: Saved searches

**Files:**
- Create: `apps/mobile/lib/saved-searches.ts`
- Create: `apps/mobile/app/saved-searches.tsx`

**Lib:** `useSavedSearches`, `useCreateSavedSearch`, `useDeleteSavedSearch`, `useToggleSearchAlerts`.

**Screen:** Each row shows the search label (auto-generated from filters, e.g. "Kelso in Pampanga · ₱5k-₱15k"), bell icon for alerts (on/off toggle), and a delete button. "Save current search" button on the Browse screen creates a new entry.

---

## Task C6: Plans & Referrals

**Files:**
- Create: `apps/mobile/app/plans.tsx`
- Create: `apps/mobile/app/referrals.tsx`

**Plans:** Three cards (Free / Basic / Pro) with benefits and monthly price. Current plan shows "Current" badge; others show "Upgrade" CTA that calls `POST /sellers/me/plan/upgrade`.

**Referrals:** Show user's referral code + copy button + share via native share sheet. Rows showing who they've referred and conversion credit.

**Resolve typed-route bug:** Once `/plans` exists, the `as never` cast in `seller/dashboard.tsx` can be removed.

---

## Task C.wrap: verify + commit + push

Type-check, bundle export, commit per screen, push to master.

**Total Phase C commits: 8–10.**
