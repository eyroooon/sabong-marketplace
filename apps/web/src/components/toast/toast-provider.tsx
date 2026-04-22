"use client";

import { useToastStore } from "@/lib/toast";
import { NotificationToast } from "./notification-toast";

const MAX_VISIBLE = 3;

/**
 * Mounts the active toast stack in the top-right of the viewport.
 * Render once, near the root of the app.
 */
export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);

  // Show the 3 most recent toasts, newest on top.
  const visible = [...toasts].slice(-MAX_VISIBLE).reverse();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2"
    >
      {visible.map((t, idx) => (
        <NotificationToast
          key={t.id}
          id={t.id}
          title={t.title}
          body={t.body}
          icon={t.icon}
          accent={t.accent}
          duration={t.duration}
          stackIndex={idx}
        />
      ))}
    </div>
  );
}
