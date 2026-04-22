"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Gift, Copy, Check, Users, Trophy, Share2 } from "lucide-react";

function computeCode(userId: string | undefined): string {
  if (!userId) return "BLOODLINE";
  // Deterministic short code from user id
  const hash = userId
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0);
  return `BL${Math.abs(hash).toString(36).toUpperCase().slice(0, 6)}`;
}

export default function ReferralsPage() {
  const { user } = useAuth();
  const code = useMemo(() => computeCode(user?.id), [user?.id]);
  const url = `https://bloodlineph.com/join/${code}`;
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on BloodlinePH",
          text: `Sumali sa BloodlinePH — safe gamefowl marketplace sa Pinas. Use my code ${code} for lifetime perks!`,
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      copy(url);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invite & Earn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Magbigay ng referral code sa mga kakilala mo. Every successful signup
          gives you perks.
        </p>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-red-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-white shadow-md">
            <Gift className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-800">
              Your Referral Code
            </p>
            <p className="mt-1 font-mono text-3xl font-black tracking-wider text-gray-900">
              {code}
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Invite 3 friends → get <strong>1 month Pro plan free</strong>
              <br />
              Invite 10 friends →{" "}
              <strong>featured listing for a week + 10% off plan</strong>
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
            <span className="truncate text-gray-700">{url}</span>
          </div>
          <button
            onClick={() => copy(url)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
          <button
            onClick={nativeShare}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Progress stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> INVITED
          </div>
          <p className="mt-1 text-2xl font-black tabular-nums">2</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5" /> JOINED
          </div>
          <p className="mt-1 text-2xl font-black tabular-nums text-green-600">
            2
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" /> REWARDS
          </div>
          <p className="mt-1 text-2xl font-black tabular-nums text-amber-600">
            1
          </p>
        </div>
      </div>

      {/* Tier progress */}
      <div className="rounded-xl border border-border bg-white p-5">
        <p className="text-sm font-semibold">Progress to next reward</p>
        <div className="mt-3">
          <div className="mb-1 flex items-baseline justify-between text-xs text-muted-foreground">
            <span>2 / 3 friends joined</span>
            <span>1 month Pro free</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500"
              style={{ width: "66%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
