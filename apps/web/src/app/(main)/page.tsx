"use client";

import Link from "next/link";
import { CATEGORIES } from "@sabong/shared";
import {
  ShieldCheck,
  Zap,
  Video,
  MessageCircle,
  Sparkles,
  MapPin,
  Bell,
  Award,
  Lock,
  Users,
  Store,
  ArrowRight,
  Check,
  X,
  Flame,
  TrendingUp,
  Star,
  Smartphone,
  Clock,
} from "lucide-react";
import { StatCounter } from "@/components/landing/stat-counter";
import { Faq } from "@/components/landing/faq";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { LiveCounter } from "@/components/landing/live-counter";
import {
  PhoneMockup,
  ScreenFeed,
  ScreenListing,
  ScreenChat,
  ScreenOrder,
} from "@/components/landing/phone-mockup";

export default function HomePage() {
  return (
    <div className="bg-[#0a0a0a] text-white">
      {/* ========== COMPLIANCE BANNER ========== */}
      <div className="relative z-10 border-b border-white/10 bg-gradient-to-r from-red-950 via-zinc-950 to-amber-950/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-white/70 md:text-xs">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            100% Legal
          </span>
          <span className="text-white/30">•</span>
          <span>Walang Betting</span>
          <span className="text-white/30">•</span>
          <span>Walang E-Sabong</span>
          <span className="text-white/30">•</span>
          <span>Walang Live Streaming</span>
          <span className="text-white/30">•</span>
          <span className="text-[#fbbf24]">Pure Marketplace Lang</span>
        </div>
      </div>

      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden">
        <div className="aurora" />
        <div className="dots absolute inset-0 opacity-40" />
        <div className="grain absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-20 md:pb-28 md:pt-28">
          {/* Badge */}
          <div className="fade-up mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur md:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </span>
            <span>Ang Unang Trusted Gamefowl Marketplace sa Pinas</span>
          </div>

          {/* Headline */}
          <h1 className="fade-up-delay-1 mx-auto max-w-5xl text-center text-5xl font-black leading-[1.05] tracking-tight md:text-7xl lg:text-[84px]">
            Bumili. Magbenta.
            <br />
            <span className="text-gradient-flame">Ligtas na ngayon.</span>
          </h1>

          {/* Subhead */}
          <p className="fade-up-delay-2 mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-white/70 md:text-xl">
            Walang hassle. Walang middleman. Verified breeders,
            escrow-protected payments, at real-time messaging — lahat nasa
            isang app.{" "}
            <span className="font-semibold text-white">
              Para sa sabungero, gawa ng sabungero.
            </span>
          </p>

          {/* CTAs */}
          <div className="fade-up-delay-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#waitlist"
              className="shimmer group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#dc2626] px-7 py-4 text-base font-bold text-white shadow-xl shadow-red-900/40 transition hover:brightness-110 sm:w-auto"
            >
              <Flame className="h-5 w-5" />
              Sumali sa Early Access
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.04] px-7 py-4 text-base font-semibold text-white/90 backdrop-blur transition hover:bg-white/[0.08] sm:w-auto"
            >
              Tingnan Paano Gumagana
            </a>
          </div>

          {/* Trust row */}
          <div className="fade-up-delay-3 mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/50 md:text-sm">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Escrow Protected
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#fbbf24]" />
              Verified Sellers
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-blue-400" />
              Safe Payments
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-red-400" />
              Posts Won't Disappear
            </span>
          </div>

          {/* Live counter — ticks up to show platform activity */}
          <LiveCounter />

          {/* App mockup preview cards */}
          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:mt-16 md:gap-6">
            <div className="float glass-strong glow-border min-h-32 rounded-2xl p-4 md:min-h-56 md:p-6">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/60 md:text-xs">
                <Video className="h-3.5 w-3.5" /> FEED
              </div>
              <div className="mt-2 text-lg font-black leading-tight sm:text-xl md:mt-3 md:text-3xl">
                <span className="text-gradient-gold">Sabungero</span> Feed
              </div>
              <div className="mt-1 text-[11px] leading-snug text-white/50 sm:text-xs md:text-sm">
                Social platform para sa sabungero — mag-post ng videos
              </div>
            </div>
            <div
              className="float glass-strong glow-border min-h-32 rounded-2xl p-4 md:min-h-56 md:p-6"
              style={{ animationDelay: "1.5s" }}
            >
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/60 md:text-xs">
                <Award className="h-3.5 w-3.5" /> VERIFIED
              </div>
              <div className="mt-2 text-lg font-black leading-tight sm:text-xl md:mt-3 md:text-3xl">
                Gov ID{" "}
                <span className="text-gradient-flame">+ Farm Permit</span>
              </div>
              <div className="mt-1 text-[11px] leading-snug text-white/50 sm:text-xs md:text-sm">
                Tunay na breeders lang
              </div>
            </div>
            <div
              className="float glass-strong glow-border min-h-32 rounded-2xl p-4 md:min-h-56 md:p-6"
              style={{ animationDelay: "3s" }}
            >
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/60 md:text-xs">
                <Sparkles className="h-3.5 w-3.5" /> AI
              </div>
              <div className="mt-2 text-lg font-black leading-tight sm:text-xl md:mt-3 md:text-3xl">
                24/7 AI <span className="text-gradient-gold">Support</span>
              </div>
              <div className="mt-1 text-[11px] leading-snug text-white/50 sm:text-xs md:text-sm">
                Tanong? May sagot agad.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== LIVE STATS ========== */}
      <section className="relative border-y border-white/10 bg-black/40 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#fbbf24]">
              <span className="h-px w-10 bg-[#fbbf24]/60" />
              Live na Bilang
              <span className="h-px w-10 bg-[#fbbf24]/60" />
            </div>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              Lumalaking komunidad ng mga{" "}
              <span className="text-gradient-flame">sabungero</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCounter
              target={1247}
              label="Active Listings"
              sublabel="Buhay na buhay"
              icon={<Store className="h-4 w-4" />}
            />
            <StatCounter
              target={342}
              label="Verified Sellers"
              sublabel="Gov ID + Farm Permit"
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <StatCounter
              target={89}
              label="Certified Farms"
              sublabel="Sa buong Pilipinas"
              icon={<Award className="h-4 w-4" />}
            />
            <StatCounter
              target={5621}
              label="Sabungero Community"
              sublabel="At dumadami pa"
              icon={<Users className="h-4 w-4" />}
            />
          </div>
        </div>
      </section>

      {/* ========== WHY NOT FACEBOOK ========== */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-red-900/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70">
              <Zap className="h-3 w-3 text-[#fbbf24]" /> The Problem
            </div>
            <h2 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
              Pagod ka na sa <span className="text-red-500">Facebook</span>?
              <br />
              <span className="text-gradient-flame">May solusyon na.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/60 md:text-lg">
              Nawawala ang posts, scammers everywhere, walang protection — tapos
              puro fake sellers. Hindi na yan.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {/* Facebook side */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl">
                  📘
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/50">
                    Facebook Marketplace
                  </div>
                  <div className="text-lg font-bold text-white/80">
                    Ang old-school na paraan
                  </div>
                </div>
              </div>
              <ul className="space-y-3 text-sm md:text-base">
                {[
                  "Nawawala ang posts sa feed after 1 hour",
                  "Walang seller verification — puro scammers",
                  "Cash-on-meetup lang, walang protection",
                  "Puro spam at comment wars",
                  "Walang proper search ng bloodlines",
                  "Wala kang ratings para malaman trusted ba",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/60">
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* BloodlinePH side */}
            <div className="glow-border relative rounded-3xl bg-gradient-to-br from-red-950/40 to-amber-950/20 p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#dc2626] text-lg">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#fbbf24]">
                    BloodlinePH
                  </div>
                  <div className="text-lg font-bold text-white">
                    Ang bagong standard
                  </div>
                </div>
              </div>
              <ul className="space-y-3 text-sm md:text-base">
                {[
                  "Permanent listings — hindi mawawala",
                  "Verified sellers — may Gov ID at Farm Permit",
                  "Escrow-protected payments — safe ang pera",
                  "Real-time messaging — walang middleman",
                  "Bloodline-organized — Kelso, Hatch, Sweater, etc.",
                  "Ratings at reviews — transparent lahat",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES GRID ========== */}
      <section className="relative border-y border-white/10 bg-gradient-to-b from-black/50 to-zinc-950 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70">
              <Sparkles className="h-3 w-3 text-[#fbbf24]" /> Features
            </div>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">
              Lahat ng kailangan mo,{" "}
              <span className="text-gradient-flame">nasa iisang app.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/60 md:text-lg">
              Hindi lang listing site — buo at kompleto na platform para sa
              sabungero community.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-[#fbbf24]/20 to-transparent blur-2xl opacity-0 transition group-hover:opacity-100" />
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg`}
                >
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{f.desc}</p>
                {f.tag && (
                  <span className="mt-3 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {f.tag}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS (with phone mockups) ========== */}
      <section id="how-it-works" className="relative py-20 md:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#fbbf24]/5 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-[#dc2626]/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70">
              <Smartphone className="h-3 w-3 text-[#fbbf24]" /> Paano Gumagana
            </div>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">
              4 simpleng steps,{" "}
              <span className="text-gradient-flame">tapos ka na.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/60 md:text-lg">
              Mula sa browse hanggang sa delivery — buo ang proseso sa loob ng
              iisang app.
            </p>
          </div>

          <div className="space-y-20 md:space-y-32">
            {mobileSteps.map((step, i) => (
              <div
                key={i}
                className={`grid grid-cols-1 items-center gap-10 md:gap-16 lg:grid-cols-2 ${
                  i % 2 === 1 ? "lg:[direction:rtl]" : ""
                }`}
              >
                {/* Phone mockup */}
                <div className="lg:[direction:ltr]">
                  <div className="relative">
                    {/* Floating step number */}
                    <div className="absolute -left-2 -top-2 z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#dc2626] text-2xl font-black text-white shadow-xl shadow-red-900/40 md:-left-4 md:-top-4 md:h-16 md:w-16 md:text-3xl">
                      {i + 1}
                    </div>
                    {step.screen}
                  </div>
                </div>

                {/* Text content */}
                <div className="lg:[direction:ltr]">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#fbbf24]/30 bg-[#fbbf24]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#fbbf24]">
                      {step.tag}
                    </div>
                    <h3 className="mt-4 text-3xl font-black leading-tight text-white md:text-4xl lg:text-5xl">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
                      {step.desc}
                    </p>
                    <ul className="mt-6 space-y-2 text-left">
                      {step.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-sm text-white/80 md:text-base"
                        >
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BLOODLINE MARQUEE ========== */}
      <section className="border-y border-white/10 bg-black py-10 overflow-hidden">
        <div className="mb-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-white/40">
            Trending Bloodlines
          </div>
        </div>
        <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="marquee flex shrink-0 gap-4 pr-4">
            {[...bloodlines, ...bloodlines].map((b, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/80"
              >
                <span className="text-[#fbbf24]">●</span>
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CATEGORIES ========== */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70">
              <Store className="h-3 w-3 text-[#fbbf24]" /> Browse
            </div>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">
              Hanapin ang{" "}
              <span className="text-gradient-flame">hinahanap mo</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/listings?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition hover:-translate-y-1 hover:border-[#fbbf24]/40 hover:bg-white/[0.06]"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#dc2626]/0 to-[#fbbf24]/0 transition group-hover:from-[#dc2626]/10 group-hover:to-[#fbbf24]/10" />
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#fbbf24]/20 to-[#dc2626]/10 text-2xl">
                  {categoryEmoji(cat.slug)}
                </div>
                <h3 className="mt-3 font-bold text-white">{cat.name}</h3>
                <p className="text-sm text-white/50">{cat.nameFil}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== LAUNCH OFFER - EVERYTHING FREE ========== */}
      <section className="relative overflow-hidden border-y border-white/10 bg-gradient-to-b from-zinc-950 to-black py-20 md:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-emerald-900/20 via-[#fbbf24]/10 to-red-900/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Sparkles className="h-3 w-3" /> Launch Offer
          </div>

          <h2 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
            Ngayong launch,{" "}
            <span className="text-gradient-flame">libre lahat.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-white/70 md:text-xl">
            Walang monthly fee. Walang commission. Walang hidden charges. Lahat
            ng features ng platform — <span className="font-semibold text-white">free para sa lahat</span>.
          </p>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: <Store className="h-5 w-5" />,
                label: "Unlimited Listings",
                sub: "Post as many as you want",
              },
              {
                icon: <Award className="h-5 w-5" />,
                label: "Full Verification",
                sub: "Gov ID + farm permit",
              },
              {
                icon: <Sparkles className="h-5 w-5" />,
                label: "All AI Features",
                sub: "24/7 AI chat support",
              },
              {
                icon: <Video className="h-5 w-5" />,
                label: "Sabungero Feed",
                sub: "Social platform + video posts",
              },
              {
                icon: <Lock className="h-5 w-5" />,
                label: "Escrow Protection",
                sub: "Safe payments",
              },
              {
                icon: <MessageCircle className="h-5 w-5" />,
                label: "Real-Time Chat",
                sub: "Direct messaging",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="glass rounded-2xl p-5 text-left"
              >
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#dc2626] text-white shadow-lg">
                  {item.icon}
                </div>
                <div className="text-base font-bold text-white">{item.label}</div>
                <div className="text-xs text-white/50">{item.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#waitlist"
              className="shimmer inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#fbbf24] to-[#dc2626] px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-900/40 transition hover:brightness-110 sm:w-auto"
            >
              <Flame className="h-5 w-5" />
              I-claim ang Libreng Access
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-5 text-xs text-white/40">
            Walang credit card. Walang bayad. Kung sumali ka ngayon, lifetime
            access ka sa launch features.
          </p>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70">
              <Star className="h-3 w-3 text-[#fbbf24]" /> Testimonials
            </div>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">
              Sinusubukan na ng{" "}
              <span className="text-gradient-flame">tunay na sabungero</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20"
              >
                <div className="flex gap-0.5 text-[#fbbf24]">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-white/80">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#fbbf24] to-[#dc2626] font-bold text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-xs text-white/50">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="border-y border-white/10 bg-black/40 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70">
              <MessageCircle className="h-3 w-3 text-[#fbbf24]" /> FAQ
            </div>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">
              Madalas na{" "}
              <span className="text-gradient-flame">mga tanong</span>
            </h2>
          </div>
          <Faq items={faqItems} />
        </div>
      </section>

      {/* ========== MOBILE APP WAITLIST ========== */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-red-900/20 to-amber-900/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#fbbf24]/30 bg-[#fbbf24]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#fbbf24]">
            <Smartphone className="h-3 w-3" /> Coming Soon
          </div>
          <h2 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
            Mobile app,
            <br />
            <span className="text-gradient-flame">parating na.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/70 md:text-lg">
            iOS at Android. Push notifications para hindi ka ma-late sa bagong
            listings. Sign up sa early access.
          </p>
          <div className="mt-8">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="relative overflow-hidden border-t border-white/10 bg-gradient-to-br from-red-950 via-zinc-950 to-amber-950/40 py-20 md:py-24">
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl font-black leading-tight md:text-6xl">
            Simulan mo na ang{" "}
            <span className="text-gradient-flame">paglago ng farm mo.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/70 md:text-lg">
            Sumali ka sa early access. Mauuna ka pag-launch — plus lifetime
            launch-pricing.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#waitlist"
              className="shimmer inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#fbbf24] to-[#dc2626] px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-900/40 transition hover:brightness-110 sm:w-auto"
            >
              <Flame className="h-5 w-5" />
              Sumali sa Early Access
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Libreng sumali
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Walang credit card
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Unsubscribe anytime
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============ Data ============

const features = [
  {
    icon: <Lock className="h-6 w-6" />,
    color: "from-emerald-500 to-emerald-700",
    title: "Escrow Payment Protection",
    desc: "Hawak muna namin ang pera hangga't na-confirm mo na natanggap mo na ang manok. Zero scam risk.",
    tag: "Core",
  },
  {
    icon: <Video className="h-6 w-6" />,
    color: "from-pink-500 to-rose-600",
    title: "Sabungero Social Feed",
    desc: "Social media platform na gawa para sa sabungero — mag-post ng videos, i-showcase ang bloodline, at mag-connect sa community.",
    tag: "Unique",
  },
  {
    icon: <Award className="h-6 w-6" />,
    color: "from-[#fbbf24] to-[#f59e0b]",
    title: "Seller Verification",
    desc: "Gov ID + farm permit verification. Only real breeders get the verified badge.",
  },
  {
    icon: <MessageCircle className="h-6 w-6" />,
    color: "from-blue-500 to-blue-700",
    title: "Real-Time Messaging",
    desc: "WebSocket-powered chat. Walang delay, typing indicators, read receipts — lahat meron.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    color: "from-violet-500 to-purple-700",
    title: "AI Chat Support",
    desc: "Claude-powered AI assistant, 24/7. Tanong mo lang — about breeds, orders, o payments.",
    tag: "New",
  },
  {
    icon: <Store className="h-6 w-6" />,
    color: "from-red-500 to-red-700",
    title: "Bloodline Organization",
    desc: "Sort by Kelso, Hatch, Sweater, Roundhead, Albany, at 20+ pang bloodlines.",
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    color: "from-teal-500 to-cyan-700",
    title: "Nearby Sellers (Soon)",
    desc: "Map view para makita mo kung saan malapit ang verified breeders.",
    tag: "Soon",
  },
  {
    icon: <Bell className="h-6 w-6" />,
    color: "from-amber-500 to-orange-600",
    title: "Saved Searches & Alerts",
    desc: "I-save ang search 'Kelso sa Pampanga under ₱15k' — notify ka kapag meron bagong match.",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    color: "from-indigo-500 to-indigo-700",
    title: "Seller Analytics",
    desc: "Track views, conversion rate, top-performing listings. Data-driven selling.",
  },
];

const mobileSteps = [
  {
    tag: "Step 1 · Discover",
    title: "Mag-browse sa social feed ng mga sabungero",
    desc: "Social media platform na gawa para sa sabungero community — mag-post, mag-like, at mag-discover ng mga champion na manok. Verified sellers lang ang lumalabas, kaya walang scam risk.",
    features: [
      "Post + swipe videos ng mga sabungero",
      "Real-time ratings + verified badge overlay",
      "Filter by bloodline, price, location",
      "Follow + save favorite sellers",
    ],
    screen: (
      <PhoneMockup>
        <ScreenFeed />
      </PhoneMockup>
    ),
  },
  {
    tag: "Step 2 · Check Details",
    title: "Tingnan ang buong listing",
    desc: "Complete details ng manok — breed, bloodline, age, weight, vaccination status. Kita mo rin ang profile at rating ng seller bago mag-commit.",
    features: [
      "Full bloodline + vaccination info",
      "Seller verification documents",
      "Past reviews from real buyers",
      "Multiple photos at videos",
    ],
    screen: (
      <PhoneMockup>
        <ScreenListing />
      </PhoneMockup>
    ),
  },
  {
    tag: "Step 3 · Negotiate",
    title: "Kausapin ang seller real-time",
    desc: "Direct in-app messaging. Mag-offer, mag-tanong, o mag-request ng additional photos. Typing indicators, read receipts — parang Messenger pero safe.",
    features: [
      "Real-time WebSocket chat",
      "Send price offers in-app",
      "Share photos + videos",
      "Block + report scammers instantly",
    ],
    screen: (
      <PhoneMockup>
        <ScreenChat />
      </PhoneMockup>
    ),
  },
  {
    tag: "Step 4 · Safe Transaction",
    title: "Bayaran nang ligtas, i-track ang delivery",
    desc: "Escrow-protected payment. Hawak ng platform ang pera hanggang confirmed mong natanggap mo na ang manok nang maayos.",
    features: [
      "GCash · Maya · Bank transfer",
      "Escrow protection — zero scam risk",
      "Nationwide shipping tracking",
      "Refund-protected kung may problema",
    ],
    screen: (
      <PhoneMockup>
        <ScreenOrder />
      </PhoneMockup>
    ),
  },
];

const bloodlines = [
  "Kelso",
  "Hatch",
  "Sweater",
  "Roundhead",
  "Albany",
  "Claret",
  "Radio",
  "Whitehackle",
  "Butcher",
  "Lemon",
  "Grey",
  "Brown Red",
];

const testimonials = [
  {
    quote:
      "Na-try ko lahat — FB, Marketplace, groups. Dito lang ako nakakita ng legit buyers at walang scam. Nabenta ko ang 3 Kelso stag in one week.",
    name: "Mario R.",
    role: "Breeder, Bulacan",
  },
  {
    quote:
      "Yung video feed sobrang galing — nakita ko yung bloodline na hinahanap ko. In-message ko agad si seller, 2 days delivered na.",
    name: "Jerome C.",
    role: "Sabungero, Cebu",
  },
  {
    quote:
      "Escrow protection yung pinaka-gusto ko. First time ko bumili online ng manok, peace of mind kasi may proteksyon ang pera.",
    name: "Rafael S.",
    role: "Buyer, Pampanga",
  },
];

const faqItems = [
  {
    q: "Legal ba ang BloodlinePH?",
    a: "Oo, 100% legal. Marketplace lang kami para sa pagbili at pagbenta ng gamefowl — walang betting, walang e-sabong, walang live streaming. Kumpleto kami sa PH marketplace at animal-trade regulations.",
  },
  {
    q: "Paano ang escrow payment?",
    a: "Kapag bumili ka, hinahawakan muna namin ang bayad mo. Pagdating ng manok at na-confirm mo na okay naman, saka namin i-release sa seller ang pera. Kung may problema, refund-protected ka.",
  },
  {
    q: "May bayad ba ang paggamit ng app?",
    a: "Ngayong launch, 100% libre lahat. Walang monthly fee, walang commission, walang hidden charges. Premium plans coming soon — pero kung early adopter ka, may special access ka sa launch features.",
  },
  {
    q: "Paano mag-verified?",
    a: "I-upload lang ang valid Gov ID at farm permit mo (kung may meron). Nirere-review namin ito sa loob ng 24 hours, then makaka-kuha ka ng verified badge na nakikita ng lahat ng buyers.",
  },
  {
    q: "Meron ba kayong mobile app?",
    a: "Web app namin is fully mobile-friendly at installable bilang PWA (add to home screen). Ang native iOS at Android apps ay parating na — mag-signup ka sa waitlist para ma-notify ka.",
  },
  {
    q: "Ano ang difference niyo sa Facebook Marketplace?",
    a: "Permanent listings (hindi nawawala), verified sellers, escrow-protected payments, real-time chat, bloodline organization, at ratings/reviews. Lahat ito wala sa Facebook.",
  },
  {
    q: "Paano ang shipping?",
    a: "Buyer ang bayad ng shipping. Ang seller ang nagse-set ng shipping fee base sa distance. Nationwide delivery available via partnered couriers.",
  },
  {
    q: "Paano kung may scammer?",
    a: "Zero tolerance. Kapag na-verify naming scammer ang seller, agad na-banned. Plus, escrow-protected ang lahat ng bayad kaya walang pera na mawawala.",
  },
];

function categoryEmoji(slug: string) {
  const map: Record<string, string> = {
    rooster: "🐓",
    hen: "🐔",
    stag: "🐥",
    pullet: "🐣",
    pair: "🐓",
    brood: "🥚",
  };
  return map[slug] ?? "🐔";
}
