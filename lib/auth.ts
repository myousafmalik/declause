import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb, type UserRow } from "@/lib/db";

const SESSION_COOKIE = "declause_session";
const SESSION_DAYS = 30;

function getSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ??
    "dev-only-insecure-secret-change-me-in-production-please";
  if (!process.env.SESSION_SECRET) {
    if (!globalThis.__declauseSecretWarned) {
      console.warn(
        "[auth] SESSION_SECRET not set in .env - using insecure dev default. Set one before deploying.",
      );
      globalThis.__declauseSecretWarned = true;
    }
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = { id: string; email: string };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
    args: [email.toLowerCase()],
  });
  const row = result.rows[0];
  if (!row) return undefined;
  return {
    id: row.id as string,
    email: row.email as string,
    password_hash: row.password_hash as string,
    created_at: Number(row.created_at),
  };
}

export async function findUserById(id: string): Promise<UserRow | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT id, email, password_hash, created_at FROM users WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  if (!row) return undefined;
  return {
    id: row.id as string,
    email: row.email as string,
    password_hash: row.password_hash as string,
    created_at: Number(row.created_at),
  };
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<UserRow> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.execute({
    sql: "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
    args: [id, email.toLowerCase(), passwordHash, now],
  });
  return {
    id,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    created_at: now,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __declauseSecretWarned: boolean | undefined;
}
