import {
  createUser,
  findUserByEmail,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  if (findUserByEmail(email)) {
    return Response.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const hash = await hashPassword(password);
  const user = createUser(email, hash);
  await setSessionCookie({ id: user.id, email: user.email });

  return Response.json({ user: { id: user.id, email: user.email } });
}
