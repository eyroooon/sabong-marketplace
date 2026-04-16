"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import { formatPHP } from "@sabong/shared";
import { cn } from "@/lib/utils";

type PlanId = "free" | "basic" | "pro";

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  maxActiveListings: number;
  featuredListingsPerMonth: number;
  canPostVideos: boolean;
  maxVideosPerMonth: number;
  commissionRate: number;
  verifiedBadge: boolean;
  prioritySupport: boolean;
  analyticsAccess: boolean;
}

interface MyPlanResponse {
  plan: PlanId;
  planDetails: Plan;
  planExpiresAt: string | null;
  expired: boolean;
  usage: {
    activeListings: number;
    maxActiveListings: number;
    videosThisMonth: number;
    maxVideosPerMonth: number;
  };
}

const PLAN_ORDER: PlanId[] = ["free", "basic", "pro"];

function formatLimit(value: number): string {
  return value === -1 ? "Unlimited" : value.toString();
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export default function PlansPage() {
  const { accessToken } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [myPlan, setMyPlan] = useState<MyPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTo, setUpgradingTo] = useState<PlanId | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    Promise.all([
      apiGet<Plan[]>("/sellers/plans").catch(() => []),
      apiGet<MyPlanResponse>("/sellers/me/plan", accessToken).catch(
        () => null,
      ),
    ])
      .then(([plansRes, myPlanRes]) => {
        setPlans(plansRes || []);
        setMyPlan(myPlanRes);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function handleSwitchPlan(plan: PlanId) {
    if (!accessToken) return;
    setError(null);
    setSuccessMessage(null);
    setUpgradingTo(plan);
    try {
      await apiPost(
        "/sellers/me/plan/upgrade",
        { plan },
        accessToken,
      );
      // Refresh current plan
      const updated = await apiGet<MyPlanResponse>(
        "/sellers/me/plan",
        accessToken,
      );
      setMyPlan(updated);
      setSuccessMessage(
        `You're now on the ${plans.find((p) => p.id === plan)?.name} plan.`,
      );
    } catch (err: any) {
      setError(err?.message || "Failed to change plan. Please try again.");
    } finally {
      setUpgradingTo(null);
    }
  }

  function getPriceDisplay(plan: Plan) {
    if (plan.price === 0) return "Free";
    if (billingCycle === "annual") {
      const annual = plan.price * 10; // 2 months free
      return `${formatPHP(annual)} / year`;
    }
    return `${formatPHP(plan.price)} / month`;
  }

  function getAnnualSavings(plan: Plan) {
    if (plan.price === 0) return null;
    const monthlyTotal = plan.price * 12;
    const annualTotal = plan.price * 10;
    return monthlyTotal - annualTotal;
  }

  const sortedPlans = [...plans].sort(
    (a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id),
  );

  const currentPlanIndex = myPlan
    ? PLAN_ORDER.indexOf(myPlan.plan)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-96 animate-pulse rounded-xl border border-border bg-muted/50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Plans & Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the plan that fits your farm. Upgrade anytime to unlock more
          listings, videos, and features.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Current usage */}
      {myPlan && (
        <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Current plan
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {myPlan.planDetails.name}
                </span>
                {myPlan.expired && (
                  <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    Expired
                  </span>
                )}
              </div>
              {myPlan.planExpiresAt && !myPlan.expired && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Renews on{" "}
                  {new Date(myPlan.planExpiresAt).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">
                  Active listings
                </div>
                <div className="mt-0.5 font-medium">
                  {myPlan.usage.activeListings} /{" "}
                  {formatLimit(myPlan.usage.maxActiveListings)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Videos this month
                </div>
                <div className="mt-0.5 font-medium">
                  {myPlan.usage.videosThisMonth} /{" "}
                  {formatLimit(myPlan.usage.maxVideosPerMonth)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing cycle toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <div className="inline-flex rounded-full border border-border bg-background p-1 text-sm">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "rounded-full px-4 py-1.5 transition-colors",
              billingCycle === "monthly"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={cn(
              "rounded-full px-4 py-1.5 transition-colors",
              billingCycle === "annual"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Annual
            <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
              2 mo free
            </span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {sortedPlans.map((plan) => {
          const planIndex = PLAN_ORDER.indexOf(plan.id);
          const isCurrent = myPlan?.plan === plan.id;
          const isUpgrade = planIndex > currentPlanIndex;
          const isDowngrade = planIndex < currentPlanIndex;
          const isPopular = plan.id === "basic";
          const isPro = plan.id === "pro";
          const savings = getAnnualSavings(plan);

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-xl border p-6 transition-colors",
                isCurrent
                  ? "border-primary bg-primary/5"
                  : isPro
                    ? "border-primary/40"
                    : "border-border bg-background",
              )}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Current Plan
                </div>
              )}

              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">
                  {getPriceDisplay(plan)}
                </div>
                {billingCycle === "annual" && savings && (
                  <div className="mt-1 text-xs text-green-700">
                    Save {formatPHP(savings)} / year
                  </div>
                )}
                {plan.price === 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Always free
                  </div>
                )}
              </div>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                <FeatureRow
                  enabled
                  label={
                    <>
                      <strong>{formatLimit(plan.maxActiveListings)}</strong>{" "}
                      active listings
                    </>
                  }
                />
                <FeatureRow
                  enabled={plan.featuredListingsPerMonth > 0}
                  label={
                    plan.featuredListingsPerMonth > 0 ? (
                      <>
                        <strong>{plan.featuredListingsPerMonth}</strong>{" "}
                        featured listings / month
                      </>
                    ) : (
                      "No featured listings"
                    )
                  }
                />
                <FeatureRow
                  enabled={plan.canPostVideos}
                  label={
                    <>
                      <strong>{formatLimit(plan.maxVideosPerMonth)}</strong>{" "}
                      videos / month
                    </>
                  }
                />
                <FeatureRow
                  enabled
                  label={
                    <>
                      <strong>{formatPercent(plan.commissionRate)}</strong>{" "}
                      platform fee
                    </>
                  }
                />
                <FeatureRow
                  enabled={plan.verifiedBadge}
                  label="Verified seller badge"
                />
                <FeatureRow
                  enabled={plan.analyticsAccess}
                  label="Analytics dashboard"
                />
                <FeatureRow
                  enabled={plan.prioritySupport}
                  label="Priority support"
                />
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
                  >
                    Current Plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleSwitchPlan(plan.id)}
                    disabled={upgradingTo !== null}
                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {upgradingTo === plan.id
                      ? "Upgrading…"
                      : `Upgrade to ${plan.name}`}
                  </button>
                ) : isDowngrade ? (
                  <button
                    onClick={() => handleSwitchPlan(plan.id)}
                    disabled={upgradingTo !== null}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {upgradingTo === plan.id
                      ? "Switching…"
                      : `Downgrade to ${plan.name}`}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
                  >
                    Unavailable
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Plans are billed in PHP. You can change plans anytime. For MVP, billing
        is not yet collected — upgrades are instant.
      </p>
    </div>
  );
}

function FeatureRow({
  enabled,
  label,
}: {
  enabled: boolean;
  label: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      {enabled ? (
        <svg
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/60"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span
        className={cn(
          enabled ? "text-foreground" : "text-muted-foreground/80",
        )}
      >
        {label}
      </span>
    </li>
  );
}
