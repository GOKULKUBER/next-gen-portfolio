"use client";

import { useState } from "react";
import { useSidebar } from "../ui/sidebar";
import CHAT_PROFILE_QUERYResult from "@/sanity.types"

export function Chat({
  profile,
}: {
  profile: CHAT_PROFILE_QUERYResult | null;
}) {
  const { toggleSidebar } = useSidebar();

  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const getGreeting = () => {
    if (!profile?.firstName) {
      return "Hi there! Ask me anything about my work, experience, or projects.";
    }

    const fullName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(" ");

    return `Hi! I'm ${fullName}. Ask me anything about my work, experience, or projects.`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };

    setMessages((prev: any) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data?.error ?? `Request failed (${res.status})`;
        setMessages((prev) => [
          ...prev,
          { role: "assistant" as const, content: `Error: ${errorMessage}` },
        ]);
        return;
      }

      const reply = data?.reply ?? "No response from assistant.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: reply },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: `Error: ${message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-black">
          Chat with {profile?.firstName || "Me"}'s assistant
        </h2>
        <button onClick={toggleSidebar} className="text-black">✕</button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500">{getGreeting()}</p>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg max-w-[80%] ${msg.role === "user"
                ? "ml-auto bg-black text-white"
                : "mr-auto bg-gray-200"
              }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="mr-auto text-gray-500">Thinking...</div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
