# Mobile Phase B: Auth & Settings — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the auth story and settings on mobile so users can recover forgotten passwords, edit their profile, change password, manage notification prefs, upload an avatar, and receive push notifications.

**Architecture:** New screens under `app/(auth)/` for the 3 recovery screens + new `app/settings/` route group. Extends existing `lib/auth.ts` with reset endpoints, adds `lib/settings.ts`, and adds `lib/push.ts` for Expo Push device registration. Reuses web patterns from `apps/web/src/app/(auth)/forgot-password/` and `apps/web/src/app/(dashboard)/settings/`.

**Tech Stack:** Expo Router 6, React Native 0.81, expo-image-picker (avatar), expo-notifications + expo-device (push), @tanstack/react-query 5, zustand 5.

---

## File Structure

```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   ├── forgot-password.tsx     # B1a (new)
│   │   ├── verify-otp.tsx          # B1b (new)
│   │   └── reset-password.tsx      # B1c (new)
│   └── settings/
│       ├── index.tsx               # B2 (new) — menu
│       ├── profile.tsx             # B2-profile (new) — edit name/phone/avatar
│       ├── security.tsx            # B2-security (new) — change password
│       └── notifications.tsx       # B2-notif-prefs (new)
└── lib/
    ├── auth.ts                     # B1 extensions: requestReset, verifyOtp, resetPassword
    ├── settings.ts                 # B2 data (new)
    └── push.ts                     # B4 data (new)
```

---

## Task B.1: Extend `lib/auth.ts` with password-reset endpoints

**Files:**
- Modify: `apps/mobile/lib/auth.ts`

API endpoints (confirmed in `apps/api/src/modules/auth/`):
- `POST /auth/forgot-password` → `{ phone }` → sends OTP, returns `{ resetToken }` temporary handle
- `POST /auth/verify-reset-otp` → `{ resetToken, code }` → returns `{ verifiedToken }`
- `POST /auth/reset-password` → `{ verifiedToken, newPassword }` → returns `{ ok: true }`

**⚠️ Before writing the client, grep the API to confirm the exact endpoint paths and field names — they may differ slightly from the web's expectations.**

- [ ] **Step 1: Verify API surface**

```bash
grep -n "@Post\|@Get" apps/api/src/modules/auth/auth.controller.ts
grep -rn "forgot\|resetToken\|verifyOtp" apps/api/src/modules/auth/ | head -20
```

- [ ] **Step 2: Add 3 async functions to `lib/auth.ts`**

After the existing `login`/`register` helpers, add:

```ts
// ───── Password reset flow ─────

export async function requestPasswordReset(phone: string): Promise<{ resetToken: string }> {
  return apiPost<{ resetToken: string }>("/auth/forgot-password", { phone });
}

export async function verifyResetOtp(input: {
  resetToken: string;
  code: string;
}): Promise<{ verifiedToken: string }> {
  return apiPost<{ verifiedToken: string }>("/auth/verify-reset-otp", input);
}

export async function resetPassword(input: {
  verifiedToken: string;
  newPassword: string;
}): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/auth/reset-password", input);
}
```

- [ ] **Step 3: Type-check + commit**

```bash
cd apps/mobile && pnpm type-check
git add apps/mobile/lib/auth.ts
git commit -m "feat(mobile/auth): add password reset helpers (forgot/verify/reset)"
```

---

## Task B.1a: Forgot Password screen

**Files:**
- Create: `apps/mobile/app/(auth)/forgot-password.tsx`

**Flow:**
1. User enters phone number (+63XXXXXXXXXX)
2. Submit → calls `requestPasswordReset`
3. On success, navigate to `/verify-otp?resetToken=...` passing the token via URL param

- [ ] **Step 1: Write the screen**

Minimal: header, phone input with +63 prefix, submit button, link back to login. Reuses the pattern from existing `app/(auth)/login.tsx` — check that first for consistent styling.

- [ ] **Step 2: Add "Forgot password?" link on login screen**

In `apps/mobile/app/(auth)/login.tsx`, below the password input add:

```tsx
<Pressable onPress={() => router.push("/forgot-password")}>
  <Text style={styles.forgotLink}>Forgot password?</Text>
</Pressable>
```

- [ ] **Step 3: Type-check + commit**

---

## Task B.1b: Verify OTP screen

**Files:**
- Create: `apps/mobile/app/(auth)/verify-otp.tsx`

**Flow:**
1. Receives `resetToken` via URL param
2. Shows 6 separate digit boxes with auto-advance
3. On submit → `verifyResetOtp({ resetToken, code })`
4. On success → push `/reset-password?verifiedToken=...`

Use React Native's `TextInput` with `onChangeText` handler that splits and auto-focuses next ref. Standard pattern.

---

## Task B.1c: Reset Password screen

**Files:**
- Create: `apps/mobile/app/(auth)/reset-password.tsx`

Receives `verifiedToken`, shows new password + confirm, calls `resetPassword`, redirects to login with success toast.

---

## Task B.2: Settings menu

**Files:**
- Create: `apps/mobile/app/settings/index.tsx`

Simple menu screen with rows:
- Profile → `/settings/profile`
- Security → `/settings/security`
- Notifications → `/settings/notifications`
- Language — with toggle EN / Taglish (B-language, stores in zustand preference)
- Logout — calls existing `useAuth().logout()`

Add "Settings" menu item in `(tabs)/profile.tsx` replacing the current "Coming soon" stub.

---

## Task B.2-profile: Profile edit

**Files:**
- Create: `apps/mobile/app/settings/profile.tsx`
- Create: `apps/mobile/lib/settings.ts`

**Lib:**
```ts
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<User, Error, Partial<User>>({
    mutationFn: (patch) => apiPatch<User>("/users/me", patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", "me"] }),
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation<{ avatarUrl: string }, Error, { image: LocalImage }>({
    mutationFn: ({ image }) => {
      const form = new FormData();
      form.append("avatar", { uri: image.uri, name: image.name, type: image.type } as Blob);
      return apiPost<{ avatarUrl: string }>("/users/me/avatar", form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users", "me"] }),
  });
}
```

**Screen:** avatar picker (circular preview + change button), first name, last name, email, city/province pickers, save button.

---

## Task B.2-security: Change password

**Files:**
- Create: `apps/mobile/app/settings/security.tsx`
- Extend: `lib/settings.ts`

```ts
export function useChangePassword() {
  return useMutation<{ ok: boolean }, Error, {
    currentPassword: string;
    newPassword: string;
  }>({
    mutationFn: (body) => apiPost<{ ok: boolean }>("/auth/change-password", body),
  });
}
```

Screen: 3 password fields (current, new, confirm) with matching validation.

---

## Task B.2-notif-prefs: Notification preferences

**Files:**
- Create: `apps/mobile/app/settings/notifications.tsx`

4 toggles: Order updates · Messages · Marketing · Promotions. Persists to `/users/me/notification-prefs` PATCH.

---

## Task B.3: Avatar upload

Already folded into **Task B.2-profile** above.

---

## Task B.4: Expo Push notifications wiring

**Files:**
- Create: `apps/mobile/lib/push.ts`
- Modify: `apps/mobile/app/_layout.tsx` (call `registerPushTokenIfNeeded()` on auth state change)

**Lib:**
```ts
// apps/mobile/lib/push.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { apiPost } from "./api";

export async function registerPushTokenIfNeeded() {
  if (!Device.isDevice) return;
  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    finalStatus = req.status;
  }
  if (finalStatus !== "granted") return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await apiPost("/users/me/push-token", { token, platform: "expo" }).catch(() => {});
}

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
```

**Root layout:** call `configureNotificationHandler()` at module load, and `registerPushTokenIfNeeded()` after login success.

---

## Task B.wrap: verify + commit + push

Same pattern as Phase A wrap: type-check, bundle export, smoke test login→forgot→otp→reset, commit per screen, final push to master.

**Total Phase B commits expected: 8–10.**
