import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "./components/auth-context";
import { ToastProvider } from "./components/toast";
import { Nav } from "./components/nav";
import {
  BYTELAPSE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: BYTELAPSE.name, url: BYTELAPSE.url }],
  creator: BYTELAPSE.name,
  publisher: BYTELAPSE.name,
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

const softwareAppLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: undefined,
  publisher: {
    "@type": "Organization",
    name: BYTELAPSE.name,
    url: BYTELAPSE.url,
  },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BYTELAPSE.name,
  url: BYTELAPSE.url,
  description: BYTELAPSE.description,
  slogan: BYTELAPSE.tagline,
  knowsAbout: BYTELAPSE.services,
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does Declause do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Declause takes any legal document — Terms & Conditions, privacy policies, NDAs, contracts — and instantly produces a plain-English summary, a list of key clauses, a red-flags section highlighting risky terms, and a fairness score from 1 to 10.",
      },
    },
    {
      "@type": "Question",
      name: "Is Declause free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Guests get 3 free analyses without signing up. Creating a free account removes the limit and syncs history across devices.",
      },
    },
    {
      "@type": "Question",
      name: "Can I upload PDFs or paste a URL?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Both. Paste text directly, upload a PDF, or drop in a URL to a privacy policy or ToS page — Declause extracts the content and analyzes it.",
      },
    },
    {
      "@type": "Question",
      name: "Is this legal advice?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Declause is an AI-assisted explainer, not a substitute for a lawyer. For anything high-stakes — a contract you're signing, a lawsuit, a business agreement — consult a qualified attorney.",
      },
    },
    {
      "@type": "Question",
      name: "Who built Declause?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Declause is built by Bytelapse, a software agency specializing in fullstack development, data engineering, and AI products.",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-50 text-neutral-900 antialiased">
        <ToastProvider>
          <AuthProvider>
            <Nav />
            {children}
          </AuthProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
