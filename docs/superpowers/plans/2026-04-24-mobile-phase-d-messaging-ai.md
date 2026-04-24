# Mobile Phase D: Messaging & AI Polish — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the last mobile-vs-web gaps: voice-note recording, typing indicators, finished reaction picker, and the AI support chat widget on mobile.

**Architecture:** Mostly delta changes on existing `messages/[id].tsx` plus a new AI support screen. Uses `expo-av` for microphone capture (already pulled in transitively via `expo-video`), WebSocket events already wired in `lib/socket.ts`.

**Tech Stack:** expo-av, Expo Router 6, socket.io-client (existing), Claude API (existing on web — mobile calls the same `/ai-chat/stream` endpoint).

---

## File Structure

```
apps/mobile/
├── app/
│   ├── messages/
│   │   └── [id].tsx                     # D1/D2/D3 modifications
│   └── support/
│       └── index.tsx                    # D4 AI chat (new)
├── components/
│   └── chat/
│       ├── VoiceRecorder.tsx            # D1 (new)
│       ├── TypingIndicator.tsx          # D2 (new)
│       └── ReactionPicker.tsx           # D3 (new)
└── lib/
    ├── messages.ts                      # Extensions for voice + reactions
    ├── socket.ts                        # Typing emit/receive
    └── ai-chat.ts                       # D4 (new)
```

---

## Task D1: Voice note recording

**Files:**
- Create: `apps/mobile/components/chat/VoiceRecorder.tsx`
- Modify: `apps/mobile/app/messages/[id].tsx` — add hold-to-record mic button next to send
- Extend: `apps/mobile/lib/messages.ts` with `useSendVoiceMessage`

**Permission check on mount:**
```ts
import { Audio } from "expo-av";
const perm = await Audio.requestPermissionsAsync();
if (!perm.granted) { /* show CTA to enable in Settings */ }
```

**Recorder component:**
- `onPressIn` → start recording (`Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)`)
- `onPressOut` → stop, get URI, send via `useSendVoiceMessage`
- Cancel by sliding left → waveform animation reverses

**Upload:** uses existing `POST /messages` with multipart FormData, `kind: "voice"` + audio file blob.

---

## Task D2: Typing indicators

**Files:**
- Modify: `apps/mobile/lib/socket.ts` — emit `typing:start` on input focus, `typing:stop` on blur or after 3s idle.
- Create: `apps/mobile/components/chat/TypingIndicator.tsx` — animated "..." bubble
- Modify: `apps/mobile/app/messages/[id].tsx` — listen to `typing:start` / `typing:stop` events scoped to current conversation, render indicator bubble at the bottom of the message list.

**API & server-side:** already implemented on web + server.

---

## Task D3: Reaction picker

**Files:**
- Create: `apps/mobile/components/chat/ReactionPicker.tsx`
- Modify: `apps/mobile/app/messages/[id].tsx` — long-press on a message bubble opens the picker as a bottom sheet.

**Reactions:** `["❤️", "🔥", "💎", "👊", "🏆", "😂"]`

**Lib extension:**
```ts
export function useAddReaction() {
  const qc = useQueryClient();
  return useMutation<Message, Error, { messageId: string; emoji: string }>({
    mutationFn: ({ messageId, emoji }) =>
      apiPost<Message>(`/messages/${messageId}/reactions`, { emoji }),
    onSuccess: (_, { messageId }) => {
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}
```

On long-press, opens animated sheet (`Animated.View` with spring) with 6 emojis in a row. Tap an emoji → call `useAddReaction` → close sheet. Reactions render as floating chips below the bubble.

---

## Task D4: AI chat support on mobile

**Files:**
- Create: `apps/mobile/lib/ai-chat.ts`
- Create: `apps/mobile/app/support/index.tsx`
- Add `Support` menu item in `(tabs)/profile.tsx` pointing at `/support`

**Lib:** wraps `/ai-chat/stream` SSE endpoint. Since SSE is tricky on RN, use a simpler non-streaming call initially (`POST /ai-chat/message` → full response) and upgrade to streaming later.

```ts
export function useSendAiMessage() {
  return useMutation<{ message: string; rateLimitRemaining: number }, Error, {
    message: string;
    conversationId?: string;
  }>({
    mutationFn: (body) => apiPost("/ai-chat/message", body),
  });
}
```

**Screen:** Simple chat interface with user bubble (right) and AI bubble (left). Show rate-limit counter in header: "5 of 10 today" for guests. Rate-limit errors surface as friendly inline messages.

---

## Task D.wrap: verify + commit + push

Type-check, bundle export, smoke test:
1. Send a text message (existing flow still works)
2. Send a voice note — appears with ▶️ play button
3. Long-press a message — pick 🔥 reaction
4. See "Pedro is typing..." when another user types (requires two devices/simulators; can fall back to mocking the socket emit)
5. Open AI support, ask "ano ang pinakamabuting Kelso?" → get Taglish reply

Commit per component, push to master.

**Total Phase D commits: 6–8.**

---

## Post-Phase-D: Full Parity Declared

After D ships, expect:
- Mobile complete features: ~44 / 47 (93%)
- Remaining 3 features are ones that were web-only by design (admin panel, sitemap, robots) — not gaps, just scope boundaries.

Declare mobile feature parity with web achieved. Ready for Phase E (if ever) or focus shifts to deployment/launch.
