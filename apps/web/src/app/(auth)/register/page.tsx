"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiPost, scheduleTokenRefresh } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const [form, setForm] = useState({
    phone: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = form.phone.startsWith("+63")
        ? form.phone
        : `+63${form.phone.replace(/^0/, "")}`;

      const res = await apiPost<{ user: any; accessToken: string; refreshToken: string }>("/auth/register", {
        phone: formattedPhone,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      });

      setAuth(res.user, res.accessToken, res.refreshToken);
      scheduleTokenRefresh();
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
          Create your account
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              First Name
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="Juan"
              className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Last Name
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="Dela Cruz"
              className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

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
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="9171234567"
              className="w-full rounded-r-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="Minimum 8 characters"
            className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Confirm Password
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            placeholder="Confirm your password"
            className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
