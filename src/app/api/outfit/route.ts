import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Gemini model selection — `gemini-flash-latest` is fast, free-tier
// eligible, and auto-tracks the latest flash release.
const MODEL = "gemini-flash-latest";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface OutfitRequest {
  city: string;
  temperature: number;
  conditions: string;
  style: string;
  tempSensitivity: "runs_cold" | "normal" | "runs_warm";
  ownedItems: string[];
}

function sensitivityPhrase(s: OutfitRequest["tempSensitivity"]): string {
  if (s === "runs_cold") return "cold";
  if (s === "runs_warm") return "warm";
  return "at a normal temperature";
}

function buildPrompt(req: OutfitRequest): string {
  const itemList = req.ownedItems.length
    ? req.ownedItems.map((i) => `- ${i}`).join("\n")
    : "(no items in closet yet)";

  return `You are a personal stylist. Recommend a complete outfit for today using ONLY items from the user's closet below.

Weather: ${Math.round(req.temperature)}°F, ${req.conditions} in ${req.city}.
Style: ${req.style.replace("_", " ")}. User runs ${sensitivityPhrase(req.tempSensitivity)}.

Closet:
${itemList}

Rules:
- Output 2–4 short lines, one per clothing layer (e.g. "Jeans with a long sleeve shirt.").
- Then one final line starting with "Note:" — a one-sentence style tip.
- No preamble, no headers, no bullet points, no markdown, no bold, no asterisks. Plain text only.
- Each line must be under 15 words.`;
}

// Strip common markdown artifacts. Gemini is instructed not to emit any,
// but we guard against it leaking through anyway.
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1") // **bold**
    .replace(/\*(.+?)\*/g, "$1") // *italic*
    .replace(/^#+\s*/gm, "") // # headers
    .replace(/^[-*]\s+/gm, "") // - / * bullets
    .trim();
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let body: OutfitRequest;
  try {
    body = (await req.json()) as OutfitRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.city !== "string" ||
    typeof body.temperature !== "number" ||
    typeof body.conditions !== "string" ||
    !Array.isArray(body.ownedItems)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(body) }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
          // gemini-flash-latest resolves to a 2.5 model with thinking on
          // by default; thinking tokens count against maxOutputTokens and
          // truncate the visible output. Disable for this short task.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    const json = (await res.json()) as GeminiResponse;

    if (!res.ok) {
      const message = json.error?.message ?? `HTTP ${res.status}`;
      return NextResponse.json(
        { error: `Gemini API error: ${message}` },
        { status: 502 },
      );
    }

    const suggestion = stripMarkdown(
      (json.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join(""),
    );

    if (!suggestion) {
      return NextResponse.json(
        { error: "No suggestion returned from Gemini" },
        { status: 502 },
      );
    }

    return NextResponse.json({ suggestion });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Gemini API error: ${msg}` },
      { status: 502 },
    );
  }
}
