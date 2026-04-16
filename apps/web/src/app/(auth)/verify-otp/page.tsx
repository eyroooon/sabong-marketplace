"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const submittingRef = useRef(false);

  useEffect(() => {
    // If no phone in query, redirect back
    if (!phone) {
      router.replace("/forgot-password");
      return;
    }
    // Focus first input
    inputsRef.current[0]?.focus();
  }, [phone, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function submitCode(code: string) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await apiPost<{ valid: boolean; token?: string }>(
        "/auth/verify-otp",
        { phone, code },
      );

      if (res.valid && res.token) {
        router.push(
          `/reset-password?token=${encodeURIComponent(res.token)}`,
        );
      } else {
        setError("Invalid verification code");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
      // Clear inputs on error for retry
      setDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  function handleDigitChange(index: number, value: string) {
    // Accept only digits
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length > 1) {
      // User pasted multiple digits
      const chars = cleaned.slice(0, OTP_LENGTH).split("");
      const next = [...digits];
      for (let i = 0; i < OTP_LENGTH; i++) {
        next[i] = chars[i] ?? "";
      }
      setDigits(next);
      const focusIdx = Math.min(chars.length, OTP_LENGTH - 1);
      inputsRef.current[focusIdx]?.focus();

      if (next.every((d) => d !== "")) {
        submitCode(next.join(""));
      }
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);

    if (cleaned && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "") && next.join("").length === OTP_LENGTH) {
      submitCode(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      await apiPost<{ otpRef: string; expiresIn: number }>(
        "/auth/forgot-password",
        { phone },
      );
      setCooldown(RESEND_COOLDOWN_SEC);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="flex items-center justify-center gap-1.5 text-2xl font-bold">
          <span className="text-primary">Bloodline</span>
          <span className="rounded-md bg-gradient-to-br from-[#fbbf24] to-[#dc2626] px-1.5 py-0.5 text-lg font-black text-white">
            PH
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verify your phone number
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <p className="mb-4 text-sm text-muted-foreground">
        Enter the 6-digit code sent to{" "}
        <span className="font-medium text-foreground">{phone}</span>.
      </p>

      <div className="mb-4">
        <div className="flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className="h-12 w-12 rounded-lg border border-input text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          ))}
        </div>
      </div>

      {loading && (
        <p className="mb-3 text-center text-sm text-muted-foreground">
          Verifying...
        </p>
      )}

      <div className="mt-4 text-center text-sm text-muted-foreground">
        {cooldown > 0 ? (
          <span>Resend code in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {resending ? "Resending..." : "Resend code"}
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong number?{" "}
        <Link
          href="/forgot-password"
          className="font-medium text-primary hover:underline"
        >
          Go back
        </Link>
      </p>
    </div>
  );
}
