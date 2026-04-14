import { cookies } from "next/headers";
import { getDb, type GuestRow } from "@/lib/db";

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

async function fetchOrCreateRow(id: string): Promise<GuestRow> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT id, count, created_at, updated_at FROM guests WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  if (row) {
    return {
      id: row.id as string,
      count: Number(row.count),
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at),
    };
  }
  const now = Date.now();
  await db.execute({
    sql: "INSERT INTO guests (id, count, created_at, updated_at) VALUES (?, 0, ?, ?)",
    args: [id, now, now],
  });
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

  const row = await fetchOrCreateRow(id);
  return {
    id,
    used: row.count,
    remaining: Math.max(0, GUEST_LIMIT - row.count),
    limit: GUEST_LIMIT,
    exhausted: row.count >= GUEST_LIMIT,
  };
}

export async function consumeGuestCall(id: string): Promise<GuestState> {
  const db = await getDb();
  const now = Date.now();
  const row = await fetchOrCreateRow(id);
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
  await db.execute({
    sql: "UPDATE guests SET count = ?, updated_at = ? WHERE id = ?",
    args: [newCount, now, id],
  });
  return {
    id,
    used: newCount,
    remaining: GUEST_LIMIT - newCount,
    limit: GUEST_LIMIT,
    exhausted: newCount >= GUEST_LIMIT,
  };
}
