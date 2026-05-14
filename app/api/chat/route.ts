import { NextRequest } from "next/server";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ??
  "https://n8n.srv765842.hstgr.cloud/webhook/chatbot-acsp-webhook";

function unescapeLiterals(s: string): string {
  return s
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t");
}

function extractAnswer(data: unknown): string | undefined {
  if (typeof data === "string") return unescapeLiterals(data);
  if (!data || typeof data !== "object") return undefined;

  const obj = data as Record<string, unknown>;
  const candidates: unknown[] = [
    (obj.payload as Record<string, unknown> | undefined)?.answer,
    (obj.payload as Record<string, unknown> | undefined)?.output,
    (obj.payload as Record<string, unknown> | undefined)?.text,
    obj.answer,
    obj.output,
    obj.text,
    obj.message,
    obj.response,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return unescapeLiterals(c);
  }

  if (Array.isArray(data) && data.length > 0) {
    return extractAnswer(data[0]);
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  let payload: { chatInput?: string; sessionId?: string };

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const chatInput = payload.chatInput?.trim();
  if (!chatInput) {
    return Response.json({ error: "chatInput is required" }, { status: 400 });
  }

  const sessionId =
    payload.sessionId ??
    `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  try {
    const upstream = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: { question: chatInput, sessionId },
      }),
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return Response.json(
        { error: `n8n responded with ${upstream.status}`, detail: text },
        { status: 502 },
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return Response.json({ output: text, sessionId });
    }

    const output = extractAnswer(data) ?? JSON.stringify(data);

    return Response.json({ output, sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return Response.json(
      { error: "Failed to reach n8n webhook", detail: message },
      { status: 502 },
    );
  }
}
