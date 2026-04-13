import { SYSTEM_PROMPT } from "@/lib/prompt";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth";
import { consumeGuestCall, readGuestState } from "@/lib/guest";

export const runtime = "nodejs";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

async function callGroq(model: string, text: string) {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("LLM_BASE_URL and LLM_API_KEY must be set in .env");
  }
  return fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });
}

function sseToTextStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // ignore malformed chunks
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit(`analyze:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return new Response(
      `Rate limit exceeded. Try again in ${limit.retryAfter}s.`,
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfter),
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(limit.resetAt / 1000)),
        },
      },
    );
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const text = body.text?.trim();
  if (!text) return new Response("Missing 'text' in request body", { status: 400 });

  const user = await getSession();
  let guestRemaining: number | null = null;

  if (!user) {
    const state = await readGuestState();
    if (state.exhausted) {
      return Response.json(
        {
          error: "Free trial limit reached. Sign up to keep analyzing.",
          remaining: 0,
          limit: state.limit,
        },
        { status: 402 },
      );
    }
    const next = consumeGuestCall(state.id);
    guestRemaining = next.remaining;
  }

  const primary = process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";
  const fallback = process.env.LLM_FALLBACK_MODEL ?? "llama-3.1-8b-instant";

  let upstream = await callGroq(primary, text);
  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    console.error(`Primary model ${primary} failed (${upstream.status}): ${errText}`);
    upstream = await callGroq(fallback, text);
    if (!upstream.ok || !upstream.body) {
      const fallbackErr = await upstream.text().catch(() => "");
      return new Response(`LLM request failed: ${upstream.status} ${fallbackErr}`, {
        status: 502,
      });
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
  };
  if (guestRemaining !== null) {
    headers["X-Guest-Remaining"] = String(guestRemaining);
  }

  return new Response(sseToTextStream(upstream.body), { headers });
}
