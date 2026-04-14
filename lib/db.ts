import { createClient, type Client } from "@libsql/client";

declare global {
  // eslint-disable-next-line no-var
  var __declauseDb: Client | undefined;
  // eslint-disable-next-line no-var
  var __declauseDbInit: Promise<void> | undefined;
}

function create(): Client {
  const url = process.env.DB_URL;
  const authToken = process.env.DB_TOKEN;
  if (!url) {
    throw new Error("DB_URL not set - add your Turso database URL to .env");
  }
  return createClient({ url, authToken });
}

async function init(client: Client): Promise<void> {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS guests (
        id TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
    ],
    "write",
  );
}

export async function getDb(): Promise<Client> {
  if (!global.__declauseDb) {
    global.__declauseDb = create();
  }
  if (!global.__declauseDbInit) {
    global.__declauseDbInit = init(global.__declauseDb);
  }
  await global.__declauseDbInit;
  return global.__declauseDb;
}

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: number;
};

export type GuestRow = {
  id: string;
  count: number;
  created_at: number;
  updated_at: number;
};
