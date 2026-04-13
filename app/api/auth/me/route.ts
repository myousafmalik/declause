import { getSession } from "@/lib/auth";
import { readGuestState } from "@/lib/guest";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSession();
  if (user) {
    return Response.json({ user, guest: null });
  }
  const guest = await readGuestState();
  return Response.json({
    user: null,
    guest: { remaining: guest.remaining, limit: guest.limit, used: guest.used },
  });
}
