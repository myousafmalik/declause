import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./components/auth-context";
import { ToastProvider } from "./components/toast";
import { Nav } from "./components/nav";

export const metadata: Metadata = {
  title: "Declause — Legal documents in plain English",
  description:
    "Paste a T&C, privacy policy, or NDA and get a plain-English breakdown with red flags and a fairness score.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-50 text-neutral-900 antialiased">
        <ToastProvider>
          <AuthProvider>
            <Nav />
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
