import { cookies } from "next/headers";
import { db, type GuestRow } from "@/lib/db";

const GUEST_COOKIE = "declause_guest";
const GUEST_LIMIT = 3;
const GUEST_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type GuestState = {
  id: string;
  used: number;
  remaining: number;
  limit: number;
  exhausted: boolean;
};

function fetchOrCreateRow(id: string): GuestRow {
  const existing = db.prepare("SELECT * FROM guests WHERE id = ?").get(id) as
    | GuestRow
    | undefined;
  if (existing) return existing;
  const now = Date.now();
  db.prepare(
    "INSERT INTO guests (id, count, created_at, updated_at) VALUES (?, 0, ?, ?)",
  ).run(id, now, now);
  return { id, count: 0, created_at: now, updated_at: now };
}

export async function readGuestState(): Promise<GuestState> {
  const store = await cookies();
  let id = store.get(GUEST_COOKIE)?.value;

  if (!id) {
    id = crypto.randomUUID();
    store.set(GUEST_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GUEST_MAX_AGE,
    });
  }

  const row = fetchOrCreateRow(id);
  return {
    id,
    used: row.count,
    remaining: Math.max(0, GUEST_LIMIT - row.count),
    limit: GUEST_LIMIT,
    exhausted: row.count >= GUEST_LIMIT,
  };
}

export function consumeGuestCall(id: string): GuestState {
  const now = Date.now();
  const row = fetchOrCreateRow(id);
  if (row.count >= GUEST_LIMIT) {
    return {
      id,
      used: row.count,
      remaining: 0,
      limit: GUEST_LIMIT,
      exhausted: true,
    };
  }
  const newCount = row.count + 1;
  db.prepare("UPDATE guests SET count = ?, updated_at = ? WHERE id = ?").run(
    newCount,
    now,
    id,
  );
  return {
    id,
    used: newCount,
    remaining: GUEST_LIMIT - newCount,
    limit: GUEST_LIMIT,
    exhausted: newCount >= GUEST_LIMIT,
  };
}
