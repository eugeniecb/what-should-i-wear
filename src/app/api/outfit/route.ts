import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "claude-haiku-4-5-20251001";

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

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
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

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: buildPrompt(body) }],
    });

    const suggestion = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    return NextResponse.json({ suggestion });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Claude API error: ${msg}` },
      { status: 502 },
    );
  }
}
