"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiPost, scheduleTokenRefresh } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resetSuccess = searchParams.get("reset") === "success";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith("+63")
        ? phone
        : `+63${phone.replace(/^0/, "")}`;

      const res = await apiPost<{ user: any; accessToken: string; refreshToken: string }>("/auth/login", {
        phone: formattedPhone,
        password,
      });

      setAuth(res.user, res.accessToken, res.refreshToken);
      scheduleTokenRefresh();
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || "Login failed");
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
          Sign in to your account
        </p>
      </div>

      {resetSuccess && !error && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          Password reset successful. Please sign in with your new password.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
