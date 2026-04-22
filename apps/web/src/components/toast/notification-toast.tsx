"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Star,
  X,
} from "lucide-react";
import { useToastStore, type ToastAccent } from "@/lib/toast";

export { useToast } from "@/lib/toast";

interface NotificationToastProps {
  id?: string;
  title: string;
  body?: string;
  icon?: React.ReactNode;
  accent?: ToastAccent;
  duration?: number;
  stackIndex?: number;
}

const ACCENT_STYLES: Record<
  ToastAccent,
  { ring: string; bg: string; icon: string; DefaultIcon: React.ComponentType<{ className?: string }> }
> = {
  green: {
    ring: "border-green-200",
    bg: "bg-green-50",
    icon: "text-green-600",
    DefaultIcon: CheckCircle2,
  },
  red: {
    ring: "border-red-200",
    bg: "bg-red-50",
    icon: "text-red-600",
    DefaultIcon: AlertTriangle,
  },
  amber: {
    ring: "border-amber-200",
    bg: "bg-amber-50",
    icon: "text-amber-600",
    DefaultIcon: Clock,
  },
  blue: {
    ring: "border-blue-200",
    bg: "bg-blue-50",
    icon: "text-blue-600",
    DefaultIcon: MessageSquare,
  },
  gold: {
    ring: "border-yellow-200",
    bg: "bg-yellow-50",
    icon: "text-yellow-600",
    DefaultIcon: Star,
  },
};

/**
 * A single slide-in toast. Intended to be rendered by ToastProvider, but can
 * be used stand-alone too. Handles its own exit animation.
 */
export function NotificationToast({
  id,
  title,
  body,
  icon,
  accent = "blue",
  duration = 4000,
  stackIndex = 0,
}: NotificationToastProps) {
  const dismiss = useToastStore((s) => s.dismiss);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const enterMs = duration - 300;
    const exitTimer = setTimeout(() => setLeaving(true), Math.max(0, enterMs));
    const removeTimer = setTimeout(() => {
      if (id) dismiss(id);
    }, duration);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, dismiss, id]);

  const styles = ACCENT_STYLES[accent];
  const Icon = styles.DefaultIcon;

  // older toasts (higher stackIndex) sit scaled down behind newer ones
  const scale = Math.max(0.88, 1 - stackIndex * 0.04);
  const translateY = stackIndex * -4;
  const opacity = Math.max(0.6, 1 - stackIndex * 0.15);

  return (
    <div
      className={`pointer-events-auto relative w-80 max-w-[calc(100vw-2rem)] rounded-xl border ${styles.ring} ${styles.bg} shadow-lg ${
        leaving ? "animate-toast-out" : "animate-toast-in"
      }`}
      style={{
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        transition: "transform 200ms ease, opacity 200ms ease",
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={`mt-0.5 shrink-0 ${styles.icon}`}>
          {icon ?? <Icon className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {title}
          </p>
          {body && (
            <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
          )}
        </div>
        {id && (
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => {
              setLeaving(true);
              setTimeout(() => dismiss(id), 200);
            }}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* inline keyframes so we don't touch globals.css */}
      <style>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateX(120%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes toast-out {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(120%);
          }
        }
        .animate-toast-in {
          animation: toast-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-toast-out {
          animation: toast-out 220ms ease-in both;
        }
      `}</style>
    </div>
  );
}
