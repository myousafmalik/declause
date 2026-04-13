export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_CHARS = 200_000;

function truncate(text: string) {
  if (text.length <= MAX_TEXT_CHARS) return text;
  return text.slice(0, MAX_TEXT_CHARS) + "\n\n[... truncated ...]";
}

async function extractPdf(buffer: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n\n") : text;
}

async function extractUrl(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http(s) URLs are supported");
  }

  const res = await fetch(parsed.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; DeclauseBot/1.0; +https://declause.app)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Failed to fetch URL (${res.status})`);

  const html = await res.text();
  const { JSDOM } = await import("jsdom");
  const { Readability } = await import("@mozilla/readability");
  const dom = new JSDOM(html, { url: parsed.toString() });
  const article = new Readability(dom.window.document).parse();
  const text = article?.textContent?.trim();
  if (!text) throw new Error("Could not extract readable text from page");
  return text;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return Response.json({ error: "Missing 'file' field" }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return Response.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const text = await extractPdf(bytes);
      return Response.json({ text: truncate(text.trim()) });
    }

    if (contentType.includes("application/json")) {
      const { url } = (await req.json()) as { url?: string };
      if (!url) return Response.json({ error: "Missing 'url'" }, { status: 400 });
      const text = await extractUrl(url);
      return Response.json({ text: truncate(text) });
    }

    return Response.json(
      { error: "Send multipart/form-data with a file, or JSON with a url" },
      { status: 400 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Extraction failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
