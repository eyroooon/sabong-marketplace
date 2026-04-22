import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP: Record<NonNullable<VerifiedBadgeProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

/**
 * Small inline badge with a gold/red gradient, tooltip "Verified breeder".
 * Uses the native `title` attribute for the tooltip so it works anywhere
 * without additional portal logic.
 */
export function VerifiedBadge({ size = "md", className = "" }: VerifiedBadgeProps) {
  const dim = SIZE_MAP[size];
  return (
    <span
      title="Verified breeder"
      aria-label="Verified breeder"
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-red-500 p-0.5 text-white shadow-sm ${className}`}
    >
      <BadgeCheck className={`${dim} drop-shadow-sm`} strokeWidth={2.25} />
    </span>
  );
}
