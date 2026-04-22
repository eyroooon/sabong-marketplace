"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

interface CommentUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CommentNode {
  id: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  createdAt: string;
  user: CommentUser;
  replies: CommentNode[];
}

interface CommentPanelProps {
  videoId: string;
  open: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

function displayName(u: CommentUser) {
  return u.displayName || `${u.firstName} ${u.lastName}`;
}

export function CommentPanel({
  videoId,
  open,
  onClose,
  onCountChange,
}: CommentPanelProps) {
  const { accessToken, user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const totalCount = (nodes: CommentNode[]): number =>
    nodes.reduce((acc, n) => acc + 1 + totalCount(n.replies), 0);

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet<{ data: CommentNode[] }>(
        `/videos/${videoId}/comments`,
        accessToken || undefined,
      );
      setComments(res.data || []);
      onCountChange?.(totalCount(res.data || []));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, videoId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !input.trim() || submitting) return;
    setSubmitting(true);
    try {
      const body: any = { content: input.trim() };
      if (replyTo) body.parentId = replyTo.id;
      const newComment = await apiPost<CommentNode>(
        `/videos/${videoId}/comments`,
        body,
        accessToken,
      );

      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...c.replies, newComment] }
              : c,
          ),
        );
      } else {
        setComments((prev) => [newComment, ...prev]);
      }
      setInput("");
      setReplyTo(null);
      onCountChange?.(
        (replyTo
          ? totalCount(comments) + 1
          : totalCount(comments) + 1),
      );
    } catch (err: any) {
      alert(err?.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string, isReply: boolean, parentId?: string) {
    if (!accessToken) return;
    if (!confirm("Delete this comment?")) return;
    try {
      await apiDelete(`/videos/comments/${commentId}`, accessToken);
      if (isReply && parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== commentId) }
              : c,
          ),
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
      onCountChange?.(totalCount(comments) - 1);
    } catch (err: any) {
      alert(err?.message || "Failed to delete");
    }
  }

  function beginReply(c: CommentNode) {
    setReplyTo(c);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />

      {/* Slide-up sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex h-[70vh] flex-col rounded-t-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">
              Comments
            </h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {loading ? "…" : totalCount(comments)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close comments"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <svg
                className="h-12 w-12 text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                />
              </svg>
              <p className="mt-3 text-sm font-medium text-gray-700">
                No comments yet
              </p>
              <p className="text-xs text-gray-500">
                Be the first to comment!
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id}>
                  <CommentRow
                    comment={c}
                    currentUserId={user?.id}
                    onReply={beginReply}
                    onDelete={(id) => handleDelete(id, false)}
                  />
                  {c.replies.length > 0 && (
                    <ul className="ml-10 mt-2 space-y-3 border-l border-gray-100 pl-3">
                      {c.replies.map((r) => (
                        <li key={r.id}>
                          <CommentRow
                            comment={r}
                            currentUserId={user?.id}
                            isReply
                            onReply={beginReply}
                            onDelete={(id) => handleDelete(id, true, c.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Input */}
        {isAuthenticated() ? (
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-100 p-3"
          >
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                <span>
                  Replying to{" "}
                  <strong className="text-gray-900">
                    {displayName(replyTo.user)}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="ml-auto text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  replyTo ? "Write a reply…" : "Add a comment…"
                }
                rows={1}
                maxLength={1000}
                className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              <button
                type="submit"
                disabled={submitting || !input.trim()}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </form>
        ) : (
          <div className="border-t border-gray-100 p-4 text-center text-sm text-gray-500">
            <a
              href="/login"
              className="font-semibold text-red-500 hover:underline"
            >
              Sign in
            </a>{" "}
            to comment.
          </div>
        )}
      </div>
    </>
  );
}

function CommentRow({
  comment,
  currentUserId,
  isReply,
  onReply,
  onDelete,
}: {
  comment: CommentNode;
  currentUserId?: string;
  isReply?: boolean;
  onReply: (c: CommentNode) => void;
  onDelete: (id: string) => void;
}) {
  const isMine = currentUserId === comment.user.id;
  const initials = (comment.user.firstName[0] || "") + (comment.user.lastName[0] || "");

  return (
    <div className="flex gap-2.5">
      <div
        className={`flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-xs font-bold text-white ${
          isReply ? "h-7 w-7" : "h-8 w-8"
        }`}
      >
        {comment.user.avatarUrl ? (
          <img
            src={comment.user.avatarUrl}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-semibold text-gray-900">
            {displayName(comment.user)}
          </p>
          <p className="text-[11px] text-gray-400">{timeAgo(comment.createdAt)}</p>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-700">
          {comment.content}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          {!isReply && (
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="font-medium hover:text-gray-900"
            >
              Reply
            </button>
          )}
          {isMine && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="font-medium hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
