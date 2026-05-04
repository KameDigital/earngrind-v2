import type { Metadata } from "next";
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
    default: "EarnGrind — Find the Highest-Paying Offerwall Game Offers",
    template: "%s | EarnGrind"
  },
  description: "EarnGrind tracks hundreds of mobile game offers across every major GPT site. Find and compare the highest payouts on Swagbucks, Freecash, InboxDollars, and more.",
  keywords: ["offerwall", "GPT sites", "earn money online", "mobile game offers", "Swagbucks offers", "Freecash offers", "game guides"],
  icons: {
    icon: [
      { url: "/favicon-earngrind.png?v=2", type: "image/png" },
      { url: "/icon.png?v=2", type: "image/png" },
    ],
    shortcut: "/favicon-earngrind.png?v=2",
    apple: "/favicon-earngrind.png?v=2",
  },
  openGraph: {
    title: "Highest Paying GPT Offers, Game Guides, and Best GPT Sites",
    description: "Compare the highest paying GPT offers, browse game guides, and discover the best GPT sites with SEO-friendly internal links across offers, games, and guides.",
    url: baseUrl,
    siteName: "EarnGrind",
    images: [
      {
        url: defaultSocialImage,
        width: 1200,
        height: 630,
        alt: "Highest Paying GPT Offers, Game Guides, and Best GPT Sites",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Highest Paying GPT Offers, Game Guides, and Best GPT Sites",
    description: "Compare the highest paying GPT offers, browse game guides, and discover the best GPT sites with SEO-friendly internal links across offers, games, and guides.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <html lang="en" className="scroll-smooth">
      <body className={`${jakarta.className} antialiased text-gray-900 selection:bg-blue-100 selection:text-blue-900`}>
        <GoogleAnalytics />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
