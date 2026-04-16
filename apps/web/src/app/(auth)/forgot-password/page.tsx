"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith("+63")
        ? phone
        : `+63${phone.replace(/^0/, "")}`;

      await apiPost<{ otpRef: string; expiresIn: number }>(
        "/auth/forgot-password",
        { phone: formattedPhone },
      );

      router.push(
        `/verify-otp?phone=${encodeURIComponent(formattedPhone)}`,
      );
    } catch (err: any) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setLoading(false);
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
          Reset your password
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <p className="mb-4 text-sm text-muted-foreground">
        Enter your registered phone number and we&apos;ll send you a 6-digit
        verification code.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Phone Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              +63
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9171234567"
              className="w-full rounded-r-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Code"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
