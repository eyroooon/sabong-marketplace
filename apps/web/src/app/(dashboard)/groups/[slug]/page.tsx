"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";

interface GroupDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  type: string;
  iconEmoji: string | null;
  coverImageUrl: string | null;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  role: string | null;
  pendingApproval: boolean;
  createdAt: string;
}

interface Post {
  id: string;
  body: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  pinnedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
}

export default function GroupDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  const { accessToken, user } = useAuth();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerBody, setComposerBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const g = await apiGet<GroupDetail>(`/groups/${slug}`, accessToken);
      setGroup(g);
      const p = await apiGet<Post[]>(`/groups/${g.id}/posts`, accessToken).catch(
        () => [],
      );
      setPosts(Array.isArray(p) ? p : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [slug, accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleJoin() {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    if (!group) return;
    setBusy(true);
    try {
      await apiPost(`/groups/${group.id}/join`, {}, accessToken);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!group || !accessToken) return;
    if (!confirm(`Leave "${group.name}"?`)) return;
    setBusy(true);
    try {
      await apiPost(`/groups/${group.id}/leave`, {}, accessToken);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handlePost() {
    if (!group || !accessToken || !composerBody.trim()) return;
    setPosting(true);
    try {
      await apiPost(
        `/groups/${group.id}/posts`,
        { body: composerBody.trim() },
        accessToken,
      );
      setComposerBody("");
      await load();
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="pb-16">
        <div className="mb-4 h-10 w-40 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-2 text-xl font-semibold">Can&apos;t load group</p>
        <p className="mb-6 text-muted-foreground">{error || "Not found"}</p>
        <Link
          href="/groups"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16 sm:pb-0">
      <Link
        href="/groups"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Groups
      </Link>

      {/* Header card */}
      <div className="mb-6 overflow-hidden rounded-xl border border-border">
        <div className="relative h-32 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500">
          <div className="absolute -bottom-8 left-6 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-amber-400 to-red-500 text-4xl shadow-lg">
            {group.iconEmoji || "👥"}
          </div>
        </div>
        <div className="px-6 pb-6 pt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                  {group.category}
                </span>
                <span>· {group.memberCount} members</span>
                <span>· {group.postCount} posts</span>
              </div>
              {group.description && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {group.description}
                </p>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {group.isMember ? (
                <>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    ✓ {group.role === "owner" ? "Owner" : "Member"}
                  </span>
                  {group.role !== "owner" && (
                    <button
                      onClick={handleLeave}
                      disabled={busy}
                      className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
                    >
                      Leave
                    </button>
                  )}
                </>
              ) : group.pendingApproval ? (
                <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Pending approval
                </span>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={busy}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {busy ? "…" : "+ Join Group"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post composer (members only) */}
      {group.isMember && (
        <div className="mb-6 rounded-xl border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-sm font-bold text-white">
              {user?.firstName?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <textarea
                value={composerBody}
                onChange={(e) => setComposerBody(e.target.value)}
                placeholder={`Share something with ${group.name}…`}
                className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                rows={2}
                maxLength={5000}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {composerBody.length}/5000
                </span>
                <button
                  onClick={handlePost}
                  disabled={!composerBody.trim() || posting}
                  className="rounded-full bg-primary px-5 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">
              No posts yet. {group.isMember ? "Be the first to post!" : ""}
            </p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const authorName =
    post.author.displayName ||
    `${post.author.firstName} ${post.author.lastName}`.trim();

  return (
    <article className="rounded-xl border border-border p-4">
      {post.pinnedAt && (
        <div className="mb-2 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-500">
          📌 Pinned
        </div>
      )}
      <header className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-sm font-bold text-white">
          {authorName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{authorName}</span>
            {post.author.isVerified && (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[9px] text-white">
                ✓
              </span>
            )}
          </div>
          <time className="text-xs text-muted-foreground">
            {formatRelativeTime(post.createdAt)}
          </time>
        </div>
      </header>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>
      {post.images && post.images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {post.images.slice(0, 4).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}
      <footer className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>❤️ {post.likesCount}</span>
        <span>💬 {post.commentsCount}</span>
      </footer>
    </article>
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
