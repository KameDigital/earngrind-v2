import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

const baseUrl = getSiteUrl();
const defaultSocialImage = "/og-earngrind.png";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "EarnGrind | GPT Offer Discovery, Guides, and Platform Research",
    template: "%s | EarnGrind",
  },
  description:
    "EarnGrind helps users discover GPT offer paths, compare payout routes, browse game hubs, read completion guides, and research GPT platform trust.",
  icons: {
    icon: [
      { url: "/favicon-earngrind.png?v=2", type: "image/png" },
      { url: "/icon.png?v=2", type: "image/png" },
    ],
    shortcut: "/favicon-earngrind.png?v=2",
    apple: "/favicon-earngrind.png?v=2",
  },
  openGraph: {
    title: "EarnGrind | GPT Offer Discovery, Guides, and Platform Research",
    description:
      "Discover GPT offer paths, compare payout routes, browse game hubs, read guides, and research platform trust.",
    url: baseUrl,
    siteName: "EarnGrind",
    images: [
      {
        url: defaultSocialImage,
        width: 1200,
        height: 630,
        alt: "EarnGrind GPT offer discovery, guides, and platform research",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EarnGrind | GPT Offer Discovery, Guides, and Platform Research",
    description:
      "Discover GPT offer paths, compare payout routes, browse game hubs, read guides, and research platform trust.",
    images: [defaultSocialImage],
    creator: "@earngrind",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GoogleAnalytics from "@/components/layout/GoogleAnalytics";
import GoogleAnalyticsPageTracker from "@/components/analytics/GoogleAnalyticsPageTracker";
import CommunityChatLauncher from "@/components/community-chat/CommunityChatLauncher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <GoogleAnalytics />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5653008366366331"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${jakarta.className} antialiased text-gray-900 selection:bg-blue-100 selection:text-blue-900`}>
        <div id="site-shell" className="min-h-screen flex flex-col transition-[padding] duration-200 motion-reduce:transition-none">
          <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] bg-[var(--brand-lime)] px-4 py-2 text-sm font-extrabold text-[var(--brand-ink)] focus:not-sr-only">
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </div>
        <Suspense fallback={null}>
          <GoogleAnalyticsPageTracker />
        </Suspense>
        <CommunityChatLauncher />
        <Analytics />
      </body>
    </html>
  );
}
