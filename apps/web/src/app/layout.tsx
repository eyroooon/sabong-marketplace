import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ChatWidget } from "@/components/ai-chat/chat-widget";
import { PWARegister } from "@/components/pwa-register";
import { ToastProvider } from "@/components/toast/toast-provider";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bloodlineph.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BloodlinePH - Buy & Sell Gamefowl in the Philippines",
    template: "%s | BloodlinePH",
  },
  description:
    "BloodlinePH is the #1 trusted online marketplace for gamefowl in the Philippines. Buy and sell roosters, hens, stags, broodcocks, and broodhens from verified breeders. Discover top bloodlines including Kelso, Hatch, Sweater, Roundhead, Albany, Claret, and more. Safe transactions, verified sellers, and nationwide shipping.",
  keywords: [
    "gamefowl",
    "sabong",
    "rooster",
    "philippines",
    "breeding",
    "kelso",
    "hatch",
    "sweater",
    "roundhead",
    "albany",
    "claret",
    "gamefowl for sale",
    "sabong marketplace",
    "fighting cocks",
    "broodcock",
    "broodhen",
    "stag",
    "philippine gamefowl",
    "buy gamefowl",
    "sell gamefowl",
    "gamefowl breeders",
  ],
  authors: [{ name: "BloodlinePH" }],
  creator: "BloodlinePH",
  publisher: "BloodlinePH",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "BloodlinePH - Buy & Sell Gamefowl in the Philippines",
    description:
      "The #1 trusted online marketplace for gamefowl in the Philippines. Buy and sell roosters, hens, stags, and more from verified breeders nationwide.",
    url: siteUrl,
    siteName: "BloodlinePH",
    type: "website",
    locale: "en_PH",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BloodlinePH - Philippine Gamefowl Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BloodlinePH - Buy & Sell Gamefowl in the Philippines",
    description:
      "The #1 trusted online marketplace for gamefowl in the Philippines. Buy and sell roosters, hens, stags, and more from verified breeders.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "shopping",
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ToastProvider />
        <AuthProvider>
          <I18nProvider>
            {children}
            <ChatWidget />
            <PWARegister />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
