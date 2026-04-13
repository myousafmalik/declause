"use client";

import { useState } from "react";
import { LogOut, ScrollText, Sparkles, User } from "lucide-react";
import { useAuth } from "./auth-context";
import { AuthModal } from "./auth-modal";
import { useToast } from "./toast";

export function Nav() {
  const { user, guest, loading, logout } = useAuth();
  const { push } = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [menuOpen, setMenuOpen] = useState(false);

  function openAuth(mode: "login" | "signup") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  async function doLogout() {
    await logout();
    setMenuOpen(false);
    push("success", "Signed out.");
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <a href="/" className="flex items-center gap-2 text-neutral-900">
            <span className="grid size-8 place-items-center rounded-lg bg-neutral-900 text-white">
              <ScrollText className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">Declause</span>
          </a>

          <div className="flex items-center gap-3">
            {!loading && !user && guest && (
              <span className="hidden items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 sm:inline-flex">
                <Sparkles className="size-3" />
                {guest.remaining} of {guest.limit} free left
              </span>
            )}

            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-100" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                    {user.email[0]?.toUpperCase()}
                  </span>
                  <span className="hidden max-w-[140px] truncate text-neutral-700 sm:inline">
                    {user.email}
                  </span>
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                      <div className="border-b border-neutral-100 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <User className="size-3" /> Signed in as
                        </div>
                        <div className="mt-0.5 truncate text-sm font-medium text-neutral-900">
                          {user.email}
                        </div>
                      </div>
                      <button
                        onClick={doLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <LogOut className="size-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => openAuth("login")}
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
                >
                  Sign in
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="rounded-lg bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
