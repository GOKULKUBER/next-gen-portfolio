import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getPortfolioContext } from "@/lib/portfolio-context";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

function normalizeMessages(
  messages: { role?: string; content?: string }[]
): { role: "system" | "user" | "assistant"; content: string }[] {
  return messages.map((m) => ({
    role: (m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user") as "system" | "user" | "assistant",
    content: typeof m.content === "string" ? m.content : "",
  }));
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const lastUserMessage = [...messages]
      .reverse()
      .find((m: { role?: string }) => m?.role === "user");
    const prompt =
      typeof lastUserMessage?.content === "string"
        ? lastUserMessage.content
        : "";

    if (!prompt.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const groqApiKey = (process.env.GROQ_API_KEY ?? "").trim();
    const baseUrl = (process.env.AI_BASE_URL ?? "").trim();

    const portfolioContext = await getPortfolioContext();
    const systemContent =
      portfolioContext.trim() ||
      "You are a portfolio assistant. Answer only based on portfolio data from Sanity. If no portfolio data is available, say that the portfolio content has not been loaded and the user should add content in Sanity.";
    const systemMessage = { role: "system" as const, content: systemContent };
    const chatMessages = [
      systemMessage,
      ...normalizeMessages(messages).filter((m) => m.content),
    ];

    // Prefer Groq (free tier, no payment)
    if (groqApiKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: chatMessages,
            max_tokens: 1024,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          return NextResponse.json(
            { error: `Groq API error: ${errText}` },
            { status: response.status }
          );
        }

        const data = await response.json();
        const reply =
          data?.choices?.[0]?.message?.content ?? "No response from assistant.";
        return NextResponse.json({ reply });
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        const err = fetchErr instanceof Error ? fetchErr : new Error("fetch failed");
        if (err.name === "AbortError") {
          return NextResponse.json(
            { error: "Request timed out. Please try again." },
            { status: 504 }
          );
        }
        return NextResponse.json(
          { error: err.message || "Groq request failed" },
          { status: 503 }
        );
      }
    }

    // Fallback: Ollama (local)
    if (!baseUrl) {
      return NextResponse.json(
        {
          reply:
            "No AI provider configured. For free AI (no payment): get an API key from https://console.groq.com and add GROQ_API_KEY to your .env.local file.",
        },
        { status: 200 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3",
          messages: chatMessages,
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const err = fetchErr instanceof Error ? fetchErr : new Error("fetch failed");
      const offlineReply =
        "No AI provider is available. For free AI (no payment): get an API key from https://console.groq.com and add GROQ_API_KEY to your .env.local file.";
      if (err.name === "AbortError") {
        return NextResponse.json({
          reply: "Request timed out. You can also use free AI: add GROQ_API_KEY from https://console.groq.com to .env.local",
        });
      }
      return NextResponse.json({ reply: offlineReply });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Ollama request failed: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply =
      data?.message?.content ?? (typeof data?.message === "string" ? data.message : "");

    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat request failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
