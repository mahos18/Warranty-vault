"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  text: string;
  time: string;
}

const QUICK_CHIPS = [
  "Show all my products",
  "Which warranties expire soon?",
  "How to claim warranty?",
  "What documents do I need?",
  "Show expired warranties",
  "Contact brand support",
];

function getTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "👋 Hey! I'm your **Smart Warranty Assistant**.\n\nI can help you with:\n• Checking warranty status & expiry dates\n• How to claim warranty for your products\n• Required documents for claims\n• Contacting brand support\n• Viewing products expiring soon\n\nWhat would you like to know?",
      time: "",
    },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  // Set initial timestamp client-side only
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m, i) => i === 0 && m.time === "" ? { ...m, time: getTime() } : m)
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", text, time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Keep rolling history (last 10 turns)
    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: text },
    ].slice(-10);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: historyRef.current,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message ?? "Groq API error");
      }

      const aiText: string =
        data.choices?.[0]?.message?.content ??
        "Sorry, I couldn't process that. Please try again.";

      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: aiText },
      ].slice(-10);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: aiText, time: getTime() },
      ]);
    } catch (err) {
      const errText = `⚠️ ${err instanceof Error ? err.message : "Something went wrong. Please try again."}`;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: errText, time: getTime() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading]);

  return (
    <div
      className="flex flex-col bg-white"
      style={{ height: "100dvh", overflow: "hidden", paddingBottom: "64px" }}
    >
      {/* ── STATIC HEADER ── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-5 pt-12 pb-4"
        style={{
          background: "linear-gradient(135deg, #4F46E5, #3730A3)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold active:scale-90 transition-transform flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 20 }}
        >
          ‹
        </button>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          🛡️
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-white tracking-tight">
            Warranty Assistant
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#4ADE80", animation: "pulse 2s infinite" }}
            />
            
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CHAT AREA ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5"
        style={{ background: "#F8F9FB" }}
      >
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={i}
              className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}
              style={{ animation: "fadeUp 0.25s ease" }}
            >
              {!isUser && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}
                >
                  🛡️
                </div>
              )}
              <div style={{ maxWidth: "78%", minWidth: 60 }}>
                <div
                  className="px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background: isUser
                      ? "linear-gradient(135deg,#4F46E5,#7C3AED)"
                      : "#fff",
                    color: isUser ? "#fff" : "#1F2937",
                    borderRadius: isUser
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                    boxShadow: isUser
                      ? "0 2px 12px rgba(79,70,229,0.3)"
                      : "0 1px 4px rgba(0,0,0,0.07)",
                    border: isUser ? "none" : "1px solid #E5E7EB",
                    whiteSpace: "pre-line",
                  }}
                >
                  {renderText(msg.text)}
                </div>
                <p
                  className="text-xs mt-1"
                  style={{
                    color: "#9CA3AF",
                    textAlign: isUser ? "right" : "left",
                  }}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}
            >
              🛡️
            </div>
            <div
              className="flex items-center gap-1 px-4 py-3 rounded-2xl"
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              {[0, 0.15, 0.3].map((d, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "#4F46E5",
                    animation: `dotPulse 1.2s ${d}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── STATIC BOTTOM — CHIPS + INPUT ── */}
      <div
        className="flex-shrink-0"
        style={{
          background: "#fff",
          borderTop: "1px solid var(--border)",
        }}
      >
        {/* Quick chips */}
        <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
          {QUICK_CHIPS.map((chip, i) => (
            <button
              key={i}
              onClick={() => sendMessage(chip)}
              disabled={loading}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform disabled:opacity-50"
              style={{
                background: "var(--primary-light)",
                color: "var(--primary)",
                border: "1px solid #C7D2FE",
                whiteSpace: "nowrap",
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-4 pb-3 pt-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about your warranties..."
            className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
            style={{
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold active:scale-90 transition-all disabled:opacity-40"
            style={{
              background: input.trim() && !loading
                ? "linear-gradient(135deg,#4F46E5,#7C3AED)"
                : "#E5E7EB",
              color: input.trim() && !loading ? "#fff" : "#9CA3AF",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            ➤
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50%       { transform: translateY(-4px); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}