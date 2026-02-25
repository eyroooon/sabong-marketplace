import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SabongMarket - Buy & Sell Gamefowl in the Philippines",
  description:
    "The #1 trusted online marketplace for gamefowl in the Philippines. Buy and sell roosters, hens, stags, and more from verified breeders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
