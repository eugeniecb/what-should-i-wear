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

  return `You are a personal stylist. The weather in ${req.city} is ${Math.round(
    req.temperature,
  )}°F with ${req.conditions}.
The user describes their style as: ${req.style.replace("_", " ")}. They run ${sensitivityPhrase(req.tempSensitivity)}.
Suggest a complete outfit using ONLY items from this list (these are items they own):
${itemList}
Be specific, practical, and brief. Format: one sentence per clothing layer, then a one-line style note.`;
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

    const suggestion = (json.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();

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
