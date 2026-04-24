"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

interface Group {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: "regional" | "bloodline" | "topic" | "general";
  type: "public" | "private" | "secret";
  iconEmoji: string | null;
  coverImageUrl: string | null;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  role: string | null;
}

type Tab = "discover" | "mine";
type CategoryFilter = "all" | "regional" | "bloodline" | "topic";

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: "All",
  regional: "Regional",
  bloodline: "Bloodline",
  topic: "Topic",
};

const CATEGORY_COLORS: Record<string, string> = {
  regional: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  bloodline: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  topic: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  general: "bg-muted text-muted-foreground",
};

export default function GroupsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("discover");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (category !== "all") qs.set("category", category);
      if (query.trim()) qs.set("q", query.trim());

      const [all, mine] = await Promise.all([
        apiGet<Group[]>(`/groups${qs.toString() ? `?${qs}` : ""}`, accessToken).catch(
          () => [],
        ),
        accessToken
          ? apiGet<Group[]>("/groups/mine", accessToken).catch(() => [])
          : Promise.resolve([]),
      ]);
      setAllGroups(Array.isArray(all) ? all : []);
      setMyGroups(Array.isArray(mine) ? mine : []);
    } finally {
      setLoading(false);
    }
  }, [accessToken, category, query]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleJoin(group: Group) {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    setBusyId(group.id);
    try {
      await apiPost(`/groups/${group.id}/join`, {}, accessToken);
      await reload();
    } catch {
      // noop
    } finally {
      setBusyId(null);
    }
  }

  async function handleLeave(group: Group) {
    if (!accessToken) return;
    if (!confirm(`Leave "${group.name}"?`)) return;
    setBusyId(group.id);
    try {
      await apiPost(`/groups/${group.id}/leave`, {}, accessToken);
      await reload();
    } catch {
      // noop
    } finally {
      setBusyId(null);
    }
  }

  const data = tab === "discover" ? allGroups : myGroups;

  return (
    <div className="pb-16 sm:pb-0">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Link
          href="/groups/new"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          + New Group
        </Link>
      </div>

      {/* Primary tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {(["discover", "mine"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "discover" ? "Discover" : "My Groups"}
            {t === "mine" && myGroups.length > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  tab === t ? "bg-primary text-white" : "bg-muted"
                }`}
              >
                {myGroups.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Secondary filters (only on Discover) */}
      {tab === "discover" && (
        <div className="mb-4 space-y-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groups…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  category === c
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-border bg-muted/30"
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              busy={busyId === group.id}
              onJoin={() => handleJoin(group)}
              onLeave={() => handleLeave(group)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupCard({
  group,
  busy,
  onJoin,
  onLeave,
}: {
  group: Group;
  busy: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-red-500 text-2xl shadow-md">
          {group.iconEmoji || "👥"}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/groups/${group.slug}`}
            className="block truncate font-semibold hover:underline"
          >
            {group.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[group.category] || CATEGORY_COLORS.general}`}
            >
              {group.category}
            </span>
            <span className="text-xs text-muted-foreground">
              {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </span>
            {group.postCount > 0 && (
              <span className="text-xs text-muted-foreground">
                · {group.postCount} {group.postCount === 1 ? "post" : "posts"}
              </span>
            )}
          </div>
        </div>
      </div>

      {group.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {group.description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2">
        <Link
          href={`/groups/${group.slug}`}
          className="flex-1 rounded-full bg-muted px-3 py-1.5 text-center text-xs font-medium text-muted-foreground hover:bg-muted/80"
        >
          View
        </Link>
        {group.isMember ? (
          <button
            onClick={onLeave}
            disabled={busy}
            className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
          >
            {busy ? "…" : "✓ Member"}
          </button>
        ) : (
          <button
            onClick={onJoin}
            disabled={busy}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "…" : "Join"}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
        👥
      </div>
      <p className="font-semibold">
        {tab === "discover" ? "No groups found" : "You're not in any groups yet"}
      </p>
      <p className="mt-1 max-w-sm px-6 text-sm text-muted-foreground">
        {tab === "discover"
          ? "Try a different category or search term."
          : "Browse Discover to find communities to join."}
      </p>
    </div>
  );
}
