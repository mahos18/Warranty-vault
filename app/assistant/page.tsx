"use client";

import { useState, useRef, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
}

// ── Mock initial conversation ──────────────────────────────
const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    text: "Hi Soham! 👋 I'm your Warranty Assistant. Ask me anything about your products, warranty status, or claim steps.",
    time: "just now",
  },
  {
    id: "2",
    role: "user",
    text: "Is my iPhone 15 Pro still under warranty?",
    time: "just now",
  },
  {
    id: "3",
    role: "assistant",
    text: "Yes! Your iPhone 15 Pro Max has an active warranty. ✅\n\nExpiry: 15 Dec 2025\nDays remaining: 284 days\nCoverage: Apple Limited Warranty (1 Year)\n\nYou're fully covered for manufacturing defects and hardware issues.",
    time: "just now",
  },
];

// ── Suggested prompts ──────────────────────────────────────
const SUGGESTIONS = [
  "Which products are expiring soon?",
  "How do I claim warranty for Samsung?",
  "Show my total protected value",
  "What's covered under Apple warranty?",
];

// ── Sub-components ─────────────────────────────────────────

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 self-end mb-0.5"
          style={{ background: "var(--primary-light)" }}
        >
          🤖
        </div>
      )}
      <div
        className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed"
        style={
          isUser
            ? {
                background: "var(--primary)",
                color: "#fff",
                borderBottomRightRadius: "6px",
              }
            : {
                background: "var(--surface)",
                color: "var(--text-primary)",
                borderBottomLeftRadius: "6px",
                border: "1px solid var(--border)",
              }
        }
      >
        {/* Preserve newlines in assistant messages */}
        {message.text.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < message.text.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0"
        style={{ background: "var(--primary-light)" }}
      >
        🤖
      </div>
      <div
        className="px-4 py-3 rounded-2xl flex items-center gap-1"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderBottomLeftRadius: "6px" }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--text-muted)",
              animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Mock assistant response — UI only
  function getMockReply(question: string): string {
    const q = question.toLowerCase();
    if (q.includes("expir")) return "You have 1 product expiring soon:\n\n⚠️ Samsung Refrigerator\nExpires: 15 Apr 2025\nDays left: 22\n\nI'd recommend contacting Samsung service before expiry.";
    if (q.includes("claim") || q.includes("how")) return "To claim warranty:\n\n1. Locate your purchase invoice\n2. Visit the brand's authorized service center\n3. Carry the product + invoice\n4. Request a job card from the technician\n\nNeed help finding a nearby service center?";
    if (q.includes("value") || q.includes("protected")) return "Your total protected value is ₹26,460 across 7 products.\n\nBreakdown:\n📱 Electronics — ₹1,34,900\n🏠 Appliances — ₹45,000\n🎧 Others — ₹18,990";
    if (q.includes("apple") || q.includes("covered")) return "Apple's 1-Year Limited Warranty covers:\n\n✅ Manufacturing defects\n✅ Hardware failures\n✅ Battery (if below 80% capacity)\n\n❌ Not covered:\nPhysical damage, liquid damage, unauthorized modifications.";
    return "I can help you with warranty status, claim procedures, and service center info. Could you be more specific about which product or issue you're referring to?";
  }

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setShowWelcome(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
      time: "just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate assistant thinking
    setTimeout(() => {
      setTyping(false);
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: getMockReply(text),
        time: "just now",
      };
      setMessages((prev) => [...prev, reply]);
    }, 1400);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-screen animate-fade-up" style={{ maxHeight: "100dvh" }}>

      {/* ── Header ── */}
      <div
        className="flex-shrink-0 px-5 pt-4 pb-3 bg-white fixed w-full h-10vh"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Warranty Assistant
        </h1>
        <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
          Ask anything about your products
        </p>
      </div>

      {/* ── Scrollable Chat Area ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 mt-20 no-scrollbar max-h-[75vh]" style={{ paddingBottom: "8px" }}>

        {/* Welcome Card */}
        {showWelcome && (
          <div
            className="rounded-2xl p-4 mb-5 text-center"
            style={{ background: "var(--primary-light)", border: "1px solid #C7D2FE" }}
          >
            <p className="text-lg font-extrabold tracking-tight mb-1" style={{ color: "var(--primary)" }}>
              Hi Soham 👋
            </p>
            <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              I can help you check warranty status, claim steps, and service info for all your products.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {typing && <TypingIndicator />}

        {/* Suggested prompts — show only when no user messages */}
        {messages.filter((m) => m.role === "user").length === 0 && (
          <div className="mt-2 mb-4">
            <p className="text-xs font-semibold mb-2 px-1" style={{ color: "var(--text-muted)" }}>
              Try asking:
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Sticky Input Bar ── */}
      <div
        className="flex-shrink-0 px-4 py-3 bg-white fixed bottom-20"
        style={{ borderTop: "1px solid var(--border)", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your warranties..."
            className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium outline-none"
            style={{
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || typing}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40"
            style={{ background: "var(--primary)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}