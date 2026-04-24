"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

type Tab = "friends" | "incoming" | "outgoing" | "suggestions";

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  province?: string | null;
  isVerified?: boolean;
  friendsSince?: string;
  requestedAt?: string;
  followersCount?: number;
}

const TAB_LABELS: Record<Tab, string> = {
  friends: "Friends",
  incoming: "Requests",
  outgoing: "Sent",
  suggestions: "Discover",
};

export default function FriendsPage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<Tab>("friends");
  const [data, setData] = useState<Record<Tab, UserRow[]>>({
    friends: [],
    incoming: [],
    outgoing: [],
    suggestions: [],
  });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const endpointFor = (t: Tab) => {
    switch (t) {
      case "friends":
        return "/friends";
      case "incoming":
        return "/friends/requests/incoming";
      case "outgoing":
        return "/friends/requests/outgoing";
      case "suggestions":
        return "/users/suggestions";
    }
  };

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [friends, incoming, outgoing, suggestions] = await Promise.all([
        apiGet<UserRow[]>("/friends", accessToken).catch(() => []),
        apiGet<UserRow[]>("/friends/requests/incoming", accessToken).catch(
          () => [],
        ),
        apiGet<UserRow[]>("/friends/requests/outgoing", accessToken).catch(
          () => [],
        ),
        apiGet<UserRow[]>("/users/suggestions", accessToken).catch(() => []),
      ]);
      setData({
        friends: Array.isArray(friends) ? friends : [],
        incoming: Array.isArray(incoming) ? incoming : [],
        outgoing: Array.isArray(outgoing) ? outgoing : [],
        suggestions: Array.isArray(suggestions) ? suggestions : [],
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function sendRequest(userId: string) {
    if (!accessToken) return;
    setBusyId(userId);
    try {
      await apiPost("/friends/request", { userId }, accessToken);
      await reload();
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  }

  async function acceptRequest(userId: string) {
    if (!accessToken) return;
    setBusyId(userId);
    try {
      await apiPost("/friends/accept", { userId }, accessToken);
      await reload();
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  }

  async function declineRequest(userId: string) {
    if (!accessToken) return;
    setBusyId(userId);
    try {
      await apiPost("/friends/decline", { userId }, accessToken);
      await reload();
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  }

  async function removeFriend(userId: string) {
    if (!accessToken) return;
    if (!confirm("Remove this friend?")) return;
    setBusyId(userId);
    try {
      await apiPost("/friends/remove", { userId }, accessToken);
      await reload();
    } catch {
      // ignore
    } finally {
      setBusyId(null);
    }
  }

  const rows = data[tab];
  const counts = {
    friends: data.friends.length,
    incoming: data.incoming.length,
    outgoing: data.outgoing.length,
    suggestions: data.suggestions.length,
  };

  return (
    <div className="pb-16 sm:pb-0">
      <h1 className="mb-4 text-2xl font-bold md:mb-6">Friends</h1>

      {/* Tab bar */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABELS[t]}
            {counts[t] > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  tab === t
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border p-4"
            >
              <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-2">
          {rows.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              tab={tab}
              busy={busyId === user.id}
              onSendRequest={() => sendRequest(user.id)}
              onAccept={() => acceptRequest(user.id)}
              onDecline={() => declineRequest(user.id)}
              onRemove={() => removeFriend(user.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  tab,
  busy,
  onSendRequest,
  onAccept,
  onDecline,
  onRemove,
}: {
  user: UserRow;
  tab: Tab;
  busy: boolean;
  onSendRequest: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onRemove: () => void;
}) {
  const name = user.displayName || `${user.firstName} ${user.lastName}`.trim();
  const location = user.city
    ? `${user.city}${user.province ? `, ${user.province}` : ""}`
    : user.province || "";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/30">
      <Link href={`/sellers/${user.id}`} className="flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-base font-bold text-white">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/sellers/${user.id}`}
            className="truncate font-semibold hover:underline"
          >
            {name}
          </Link>
          {user.isVerified && (
            <span
              title="Verified seller"
              className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white"
            >
              ✓
            </span>
          )}
        </div>
        {location && (
          <p className="truncate text-xs text-muted-foreground">📍 {location}</p>
        )}
        {user.friendsSince && (
          <p className="text-[11px] text-muted-foreground">
            Friends since {new Date(user.friendsSince).toLocaleDateString()}
          </p>
        )}
        {user.requestedAt && (
          <p className="text-[11px] text-muted-foreground">
            {formatRelativeTime(user.requestedAt)}
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {tab === "friends" && (
          <>
            <Link
              href={`/messages?dm=${user.id}`}
              className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              Message
            </Link>
            <button
              onClick={onRemove}
              disabled={busy}
              className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
            >
              {busy ? "…" : "Remove"}
            </button>
          </>
        )}

        {tab === "incoming" && (
          <>
            <button
              onClick={onAccept}
              disabled={busy}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? "…" : "Accept"}
            </button>
            <button
              onClick={onDecline}
              disabled={busy}
              className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
            >
              Decline
            </button>
          </>
        )}

        {tab === "outgoing" && (
          <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600">
            Pending
          </span>
        )}

        {tab === "suggestions" && (
          <button
            onClick={onSendRequest}
            disabled={busy}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "…" : "+ Add Friend"}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; subtitle: string }> = {
    friends: {
      title: "No friends yet",
      subtitle: "Discover sabungeros and send friend requests to build your network.",
    },
    incoming: {
      title: "No pending requests",
      subtitle: "When someone sends you a friend request, it'll show up here.",
    },
    outgoing: {
      title: "No sent requests",
      subtitle: "Browse Discover to find sabungeros and send friend requests.",
    },
    suggestions: {
      title: "No suggestions right now",
      subtitle: "Check back later as more sabungeros join the platform.",
    },
  };
  const m = messages[tab];

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
        👥
      </div>
      <p className="font-semibold">{m.title}</p>
      <p className="mt-1 max-w-sm px-6 text-sm text-muted-foreground">
        {m.subtitle}
      </p>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
