export type HistoryItem = {
  id: string;
  createdAt: number;
  title: string;
  input: string;
  output: string;
};

const KEY = "declause:history:v1";
const MAX_ITEMS = 25;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadHistory(): HistoryItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // quota exceeded - drop oldest and retry once
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(0, 10)));
    } catch {
      // give up silently
    }
  }
}

export function addHistoryItem(item: Omit<HistoryItem, "id" | "createdAt">): HistoryItem {
  const full: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const existing = loadHistory();
  saveHistory([full, ...existing]);
  return full;
}

export function removeHistoryItem(id: string): HistoryItem[] {
  const next = loadHistory().filter((i) => i.id !== id);
  saveHistory(next);
  return next;
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY);
}

export function titleFromInput(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? trimmed.slice(0, 57) + "…" : trimmed || "Untitled";
}
