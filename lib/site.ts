export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://declause.bytelapse.com";

export const SITE_NAME = "Declause";

export const SITE_TAGLINE = "Legal documents in plain English";

export const SITE_DESCRIPTION =
  "Instantly translate Terms & Conditions, privacy policies, and NDAs into plain English. Spot red flags, hidden clauses, auto-renewals, arbitration waivers, and data sharing - before you click agree.";

export const SITE_KEYWORDS = [
  "plain english legal",
  "terms and conditions summarizer",
  "privacy policy analyzer",
  "NDA summary",
  "legal document AI",
  "contract red flags",
  "T&C in plain english",
  "privacy policy plain english",
  "legal jargon translator",
  "ToS analyzer",
];

export const BYTELAPSE = {
  name: "Bytelapse",
  tagline: "Software agency building fullstack, data, and AI products.",
  description:
    "Bytelapse is a software agency partnering with startups and scale-ups to ship production-grade fullstack applications, data platforms, and AI products. We build, we ship, we maintain.",
  url: "https://bytelapse.com",
  services: [
    "Full-stack web development",
    "Data engineering & analytics",
    "AI & machine learning",
    "Product design & prototyping",
    "DevOps & cloud infrastructure",
  ],
} as const;

export const TWITTER_HANDLE = "@bytelapse";
