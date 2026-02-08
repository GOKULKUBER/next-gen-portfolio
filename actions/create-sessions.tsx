"use server";

import { auth } from "@clerk/nextjs/server";

export async function sendMessageToOllama(prompt: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }

  const baseUrl = process.env.AI_BASE_URL;

  if (!baseUrl) {
    throw new Error("AI_BASE_URL not configured");
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama request failed: ${error}`);
  }

  const data = await response.json();

  return {
    userId,
    reply: data.message.content,
  };
}
