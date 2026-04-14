"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  FileText,
  Link2,
  Loader2,
  Sparkles,
  StopCircle,
  Trash2,
  History,
  Eraser,
  ShieldAlert,
  Scale,
  Eye,
  Zap,
  Lock,
  Globe,
} from "lucide-react";
import {
  addHistoryItem,
  clearHistory,
  loadHistory,
  removeHistoryItem,
  titleFromInput,
  type HistoryItem,
} from "@/lib/history";
import { useAuth } from "./components/auth-context";
import { useToast } from "./components/toast";
import { AuthModal } from "./components/auth-modal";

export default function Page() {
  const { user, guest, refresh, setGuestRemaining } = useAuth();
  const { push } = useToast();

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function analyze() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setOutput("");
    setCopied(false);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let streamed = "";
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
        signal: ctrl.signal,
      });

      if (res.status === 402) {
        setAuthPrompt(true);
        await refresh();
        push("error", "Free trial used up — sign up to keep going.");
        return;
      }

      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "Request failed");
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const remainingHeader = res.headers.get("X-Guest-Remaining");
      if (remainingHeader !== null && !user) {
        setGuestRemaining(Number(remainingHeader));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamed += chunk;
        setOutput((prev) => prev + chunk);
      }

      if (streamed.trim()) {
        const saved = addHistoryItem({
          title: titleFromInput(input),
          input,
          output: streamed,
        });
        setHistory((h) => [saved, ...h].slice(0, 25));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        push("error", (err as Error).message);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  async function handleFile(file: File) {
    setExtracting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setInput(data.text ?? "");
      push("success", `Extracted ${data.text?.length ?? 0} characters from ${file.name}`);
    } catch (err) {
      push("error", (err as Error).message);
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function fetchUrl() {
    if (!url.trim() || extracting) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setInput(data.text ?? "");
      setUrl("");
      push("success", "Page content extracted.");
    } catch (err) {
      push("error", (err as Error).message);
    } finally {
      setExtracting(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      push("error", "Could not copy to clipboard");
    }
  }

  function restoreHistory(item: HistoryItem) {
    setInput(item.input);
    setOutput(item.output);
    setHistoryOpen(false);
  }

  function deleteHistory(id: string) {
    setHistory(removeHistoryItem(id));
  }

  function clearAllHistory() {
    clearHistory();
    setHistory([]);
  }

  const busy = loading || extracting;
  const guestLeft = !user && guest ? guest.remaining : null;
  const guestExhausted = guestLeft === 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
      <section className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Legal docs,{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
            in plain English
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-base text-neutral-600">
          Paste, upload, or link a T&amp;C, privacy policy, or NDA. Get a clear
          breakdown with red flags and a fairness score in seconds.
        </p>
      </section>

      {!user && guest && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-indigo-900">
            <Sparkles className="size-4" />
            <span>
              {guestExhausted ? (
                <>You&apos;ve used all your free analyses.</>
              ) : (
                <>
                  <strong>{guest.remaining}</strong> of {guest.limit} free analyses
                  remaining.
                </>
              )}
            </span>
          </div>
          {guestExhausted && (
            <button
              onClick={() => setAuthPrompt(true)}
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Sign up free
            </button>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            <FileText className="size-4" /> Upload PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2 shadow-sm focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900">
            <Link2 className="size-4 text-neutral-400" />
            <input
              type="url"
              placeholder="https://example.com/privacy"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUrl()}
              disabled={busy}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={fetchUrl}
              disabled={!url.trim() || busy}
              className="rounded-md px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              Fetch
            </button>
          </div>

          <button
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
          >
            <History className="size-4" />
            <span className="hidden sm:inline">History</span>
            <span className="text-xs text-neutral-500">({history.length})</span>
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            extracting
              ? "Extracting…"
              : "Paste your legal document here, or use Upload PDF / Fetch URL above."
          }
          className="w-full min-h-[260px] resize-y rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 text-sm font-mono leading-relaxed shadow-inner focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:opacity-60"
          disabled={busy}
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={analyze}
              disabled={!input.trim() || busy || guestExhausted}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {loading ? "Analyzing…" : extracting ? "Extracting…" : "Analyze"}
            </button>
            {loading && (
              <button
                onClick={stop}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                <StopCircle className="size-4" /> Stop
              </button>
            )}
          </div>

          {(input || output) && !busy && (
            <button
              onClick={() => {
                setInput("");
                setOutput("");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900"
            >
              <Eraser className="size-3.5" /> Clear
            </button>
          )}
        </div>
      </section>

      {(loading || output) && (
        <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Analysis
            </h2>
            {output && (
              <button
                onClick={copyOutput}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" /> Copy
                  </>
                )}
              </button>
            )}
          </div>
          {!output && loading && (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="size-4 animate-spin" /> Reading the document…
            </div>
          )}
          <article className="prose prose-neutral max-w-none prose-headings:tracking-tight">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
          </article>
        </section>
      )}

      <HowItWorks />
      <FeaturesGrid />
      <FAQ />
      <AboutBytelapse />

      <footer className="mt-16 border-t border-neutral-200 pt-8 pb-4">
        <div className="flex flex-col items-center gap-3 text-center text-xs text-neutral-500 sm:flex-row sm:justify-between sm:text-left">
          <div>
            © {new Date().getFullYear()} Declause · Built by{" "}
            <a
              href="https://bytelapse.com"
              target="_blank"
              rel="noopener"
              className="font-medium text-neutral-700 hover:text-neutral-900"
            >
              Bytelapse
            </a>
          </div>
          <div className="max-w-md text-neutral-400">
            Declause is not legal advice. For anything high-stakes, consult a qualified
            attorney.
          </div>
        </div>
      </footer>

      {historyOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm"
            onClick={() => setHistoryOpen(false)}
          />
          <aside className="relative ml-auto flex h-full w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-neutral-900">History</h3>
              <div className="flex items-center gap-3">
                {history.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-900"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {history.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-neutral-500">
                  No analyses yet.
                </p>
              ) : (
                <ul className="space-y-1">
                  {history.map((h) => (
                    <li
                      key={h.id}
                      className="group flex items-start gap-2 rounded-lg p-3 hover:bg-neutral-50"
                    >
                      <button
                        onClick={() => restoreHistory(h)}
                        className="flex-1 text-left"
                      >
                        <div className="line-clamp-1 text-sm font-medium text-neutral-800">
                          {h.title}
                        </div>
                        <div className="mt-0.5 text-xs text-neutral-500">
                          {new Date(h.createdAt).toLocaleString()}
                        </div>
                      </button>
                      <button
                        onClick={() => deleteHistory(h.id)}
                        className="opacity-0 transition group-hover:opacity-100"
                      >
                        <Trash2 className="size-4 text-neutral-400 hover:text-red-600" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}

      <AuthModal
        open={authPrompt}
        onClose={() => setAuthPrompt(false)}
        initialMode="signup"
      />
    </main>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: "Drop in any document",
      body: "Paste text, upload a PDF, or give us a URL to a privacy policy or Terms of Service page. Declause extracts the content automatically.",
    },
    {
      icon: Zap,
      title: "AI reads it line by line",
      body: "Our language model rewrites the document in plain English, pulls out the clauses that actually matter, and flags anything unusual or user-hostile.",
    },
    {
      icon: ShieldAlert,
      title: "Spot red flags instantly",
      body: "Auto-renewals, arbitration waivers, broad data sharing, IP grabs — you see them before you click agree, with a 1–10 fairness score and a bottom-line verdict.",
    },
  ];
  return (
    <section id="how-it-works" className="mt-20">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          How Declause works
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">
          Three steps from legal jargon to a decision you can actually make.
        </p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white">
                <s.icon className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Step {i + 1}
              </span>
            </div>
            <h3 className="text-base font-semibold text-neutral-900">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    {
      icon: Eye,
      title: "Red flags, surfaced",
      body: "Data sharing, auto-renewal, arbitration, liability waivers, IP claims — all called out explicitly.",
    },
    {
      icon: Scale,
      title: "Fairness score",
      body: "A 1–10 rating tells you at a glance whether a document is user-friendly or predatory.",
    },
    {
      icon: Lock,
      title: "Your docs stay yours",
      body: "Pasted text is sent once to the language model for analysis. No long-term storage, no training data.",
    },
    {
      icon: Globe,
      title: "Works everywhere",
      body: "Terms of Service, privacy policies, NDAs, employment contracts, SaaS agreements, EULAs.",
    },
  ];
  return (
    <section id="features" className="mt-16">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">What you get</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-800">
              <f.icon className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "What does Declause do?",
      a: "Declause takes any legal document — Terms & Conditions, privacy policies, NDAs, contracts — and instantly produces a plain-English summary, a list of key clauses, a red-flags section highlighting risky terms, and a fairness score from 1 to 10.",
    },
    {
      q: "Is Declause free?",
      a: "Yes. Guests get 3 free analyses without signing up. Creating a free account removes the limit. We may add paid tiers later for heavy users, but the core tool stays free.",
    },
    {
      q: "Can I upload PDFs or paste a URL?",
      a: "Both. Paste text directly, drop in a PDF (up to 10 MB), or fetch from a URL — Declause extracts the content and analyzes it for you.",
    },
    {
      q: "Is this legal advice?",
      a: "No. Declause is an AI-assisted explainer, not a substitute for a lawyer. For anything high-stakes, consult a qualified attorney. Treat our output as a starting point, not a verdict.",
    },
    {
      q: "Who built Declause?",
      a: "Declause is built and maintained by Bytelapse, a software agency specializing in fullstack development, data engineering, and AI products.",
    },
  ];
  return (
    <section id="faq" className="mt-16">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Common questions</h2>
      </div>
      <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
        {faqs.map((f) => (
          <details key={f.q} className="group px-5 py-4">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-neutral-900 marker:hidden">
              {f.q}
              <span className="text-neutral-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function AboutBytelapse() {
  const services = [
    "Full-stack web development",
    "Data engineering & analytics",
    "AI & machine learning",
    "Product design & prototyping",
    "DevOps & cloud infrastructure",
  ];
  return (
    <section id="about" className="mt-16">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-900 via-indigo-950 to-fuchsia-950 p-8 text-white shadow-sm sm:p-10">
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 size-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-300">
            Built by Bytelapse
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            A software agency that ships.
          </h2>
          <p className="mt-3 max-w-2xl text-neutral-200">
            Bytelapse partners with startups and scale-ups to build production-grade
            fullstack applications, data platforms, and AI products. Declause is one of
            our side projects — a taste of what we build when we&apos;re not on a
            client engagement.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {services.map((s) => (
              <li
                key={s}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-neutral-100 backdrop-blur"
              >
                {s}
              </li>
            ))}
          </ul>
          <a
            href="https://bytelapse.com"
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100"
          >
            Visit bytelapse.com →
          </a>
        </div>
      </div>
    </section>
  );
}
