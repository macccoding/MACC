"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface Message {
  id: string;
  role: "user" | "kemi";
  content: string;
  timestamp: string;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const STORAGE_KEY = "kemi-chat-messages";
const MAX_STORED = 50;

function loadStoredMessages(): Message[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Message[];
      if (parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

function saveMessages(messages: Message[]) {
  try {
    // Only store the last MAX_STORED messages
    const toStore = messages.filter((m) => m.id !== "welcome").slice(-MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {}
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = loadStoredMessages();
    if (stored.length > 0) return stored;
    return [
      {
        id: "welcome",
        role: "kemi",
        content: "Hey Mike. What's on your mind?",
        timestamp: getTime(),
      },
    ];
  });
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist messages whenever they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: getTime(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        // Build API history — exclude welcome message, map "kemi" → "assistant"
        const apiHistory = messages
          .filter((m) => m.id !== "1")
          .map((m) => ({
            role: m.role === "kemi" ? ("assistant" as const) : ("user" as const),
            content: m.content,
          }));

        const res = await fetch("/api/kemi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history: apiHistory }),
        });

        if (!res.ok) throw new Error(`API ${res.status}`);

        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "kemi",
            content: data.content,
            timestamp: getTime(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "kemi",
            content: "Connection failed. Try again.",
            timestamp: getTime(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            className="fixed inset-0 z-[90] bg-ink-black/40 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-label="Chat with Kemi"
            aria-modal="true"
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[360px] z-[100] bg-ink-deep border-l border-sumi-gray-dark/15 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            {/* Header */}
            <div className="h-13 flex items-center justify-between px-4 border-b border-sumi-gray-dark/15 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-vermillion/15 border border-vermillion/25 flex items-center justify-center">
                  <span className="text-vermillion text-[8px] font-serif">
                    K
                  </span>
                </div>
                <span className="text-parchment text-xs font-serif tracking-wide">
                  Kemi
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setMessages([
                      {
                        id: "welcome",
                        role: "kemi",
                        content: "Hey Mike. What's on your mind?",
                        timestamp: getTime(),
                      },
                    ]);
                    localStorage.removeItem(STORAGE_KEY);
                  }}
                  aria-label="Clear chat"
                  className="text-sumi-gray hover:text-parchment transition-colors text-[10px] font-mono tracking-wide px-2 py-1 rounded hover:bg-sumi-gray-dark/20"
                >
                  Clear
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close chat"
                  className="text-sumi-gray hover:text-parchment transition-colors text-sm sm:text-sm text-lg w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-hide"
            >
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-vermillion/15 border border-vermillion/25 flex items-center justify-center shrink-0">
                    <span className="text-vermillion text-[10px] font-serif">
                      K
                    </span>
                  </div>
                  <div className="bg-ink-dark/70 px-3.5 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-1 rounded-full bg-sumi-gray"
                          animate={{ opacity: [0.2, 0.8, 0.2] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <ChatInput onSend={handleSend} disabled={loading} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
