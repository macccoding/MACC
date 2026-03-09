"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import EntityFeed from "./EntityFeed";

// ── Types ────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  followUp?: string | null;
  createdNodes?: string[];
  updatedNodes?: string[];
  createdAt: string;
}

interface ChatResponse {
  reply: string;
  follow_up?: string | null;
  created: string[];
  updated: string[];
}

interface ChatPanelProps {
  onNodeClick?: (name: string) => void;
  onNodesChanged?: () => void;
}

// ── Component ────────────────────────────────────────────────────────

export default function ChatPanel({ onNodeClick, onNodesChanged }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch existing messages on mount ────────────────────────────

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch("/api/kioku/messages?limit=50");
        if (res.ok) {
          const data = await res.json();
          // Messages come newest-first from API, reverse for display
          const msgs: Message[] = (data.messages || []).reverse();
          setMessages(msgs);
        }
      } catch (err) {
        console.error("[ChatPanel] Failed to load messages:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadMessages();
  }, []);

  // ── Auto-scroll ─────────────────────────────────────────────────

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  // ── Send text message ───────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/kioku/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });

        if (res.ok) {
          const data: ChatResponse = await res.json();
          const assistantMsg: Message = {
            id: `resp-${Date.now()}`,
            role: "assistant",
            content: data.reply,
            followUp: data.follow_up,
            createdNodes: data.created,
            updatedNodes: data.updated,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);

          if (data.created.length > 0 || data.updated.length > 0) {
            onNodesChanged?.();
          }
        } else {
          const assistantMsg: Message = {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "Something went wrong. Please try again.",
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (err) {
        console.error("[ChatPanel] Send error:", err);
        const assistantMsg: Message = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Connection error. Please try again.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [loading, onNodesChanged]
  );

  // ── Handle Enter key ────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  // ── Voice recording ─────────────────────────────────────────────

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "voice.webm");
        formData.append("context", "Voice memo recording");

        setLoading(true);
        try {
          const res = await fetch("/api/kioku/ingest", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data: ChatResponse = await res.json();
            const assistantMsg: Message = {
              id: `voice-${Date.now()}`,
              role: "assistant",
              content: data.reply,
              followUp: data.follow_up,
              createdNodes: data.created,
              updatedNodes: data.updated,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            if (data.created.length > 0 || data.updated.length > 0) {
              onNodesChanged?.();
            }
          }
        } catch (err) {
          console.error("[ChatPanel] Voice ingest error:", err);
        } finally {
          setLoading(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("[ChatPanel] Microphone access denied:", err);
    }
  }, [isRecording, onNodesChanged]);

  // ── File upload ─────────────────────────────────────────────────

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", `Uploaded file: ${file.name}`);

      const userMsg: Message = {
        id: `file-${Date.now()}`,
        role: "user",
        content: `[File: ${file.name}]`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const res = await fetch("/api/kioku/ingest", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data: ChatResponse = await res.json();
          const assistantMsg: Message = {
            id: `file-resp-${Date.now()}`,
            role: "assistant",
            content: data.reply,
            followUp: data.follow_up,
            createdNodes: data.created,
            updatedNodes: data.updated,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          if (data.created.length > 0 || data.updated.length > 0) {
            onNodesChanged?.();
          }
        }
      } catch (err) {
        console.error("[ChatPanel] File upload error:", err);
      } finally {
        setLoading(false);
        // Reset file input
        e.target.value = "";
      }
    },
    [onNodesChanged]
  );

  // ── Camera capture ──────────────────────────────────────────────

  const handleCameraCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("context", "Photo capture");

      const userMsg: Message = {
        id: `photo-${Date.now()}`,
        role: "user",
        content: "[Photo]",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const res = await fetch("/api/kioku/ingest", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data: ChatResponse = await res.json();
          const assistantMsg: Message = {
            id: `photo-resp-${Date.now()}`,
            role: "assistant",
            content: data.reply,
            followUp: data.follow_up,
            createdNodes: data.created,
            updatedNodes: data.updated,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          if (data.created.length > 0 || data.updated.length > 0) {
            onNodesChanged?.();
          }
        }
      } catch (err) {
        console.error("[ChatPanel] Camera capture error:", err);
      } finally {
        setLoading(false);
        e.target.value = "";
      }
    },
    [onNodesChanged]
  );

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--kioku-bg)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-center py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--kioku-border)" }}
      >
        <h2
          className="text-lg tracking-wider"
          style={{
            color: "var(--kioku-text)",
            fontFamily: "'Noto Serif JP', serif",
          }}
        >
          {"\u8A18\u61B6"}
        </h2>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {initialLoading ? (
          <div
            className="text-center py-8 text-sm"
            style={{ color: "var(--kioku-muted)" }}
          >
            Loading...
          </div>
        ) : messages.length === 0 ? (
          <div
            className="text-center py-12 text-sm"
            style={{ color: "var(--kioku-muted)" }}
          >
            Begin a conversation to build your knowledge graph.
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                          backgroundColor:
                            "color-mix(in srgb, var(--kioku-accent) 18%, transparent)",
                          color: "var(--kioku-text)",
                        }
                      : {
                          backgroundColor: "var(--kioku-bg-raised)",
                          color: "var(--kioku-text)",
                          border: "1px solid var(--kioku-border)",
                        }
                  }
                >
                  {msg.content}
                </div>
              </div>

              {/* Follow-up suggestion */}
              {msg.role === "assistant" && msg.followUp && (
                <div className="mt-1 ml-1">
                  <button
                    onClick={() => sendMessage(msg.followUp!)}
                    className="text-xs italic cursor-pointer transition-opacity hover:opacity-80"
                    style={{ color: "var(--kioku-muted)" }}
                  >
                    {msg.followUp}
                  </button>
                </div>
              )}

              {/* Entity feed after assistant messages */}
              {msg.role === "assistant" &&
                ((msg.createdNodes && msg.createdNodes.length > 0) ||
                  (msg.updatedNodes && msg.updatedNodes.length > 0)) && (
                  <div className="mt-1">
                    <EntityFeed
                      created={msg.createdNodes || []}
                      updated={msg.updatedNodes || []}
                      onNodeClick={onNodeClick}
                    />
                  </div>
                )}
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-2.5 text-sm"
              style={{
                backgroundColor: "var(--kioku-bg-raised)",
                color: "var(--kioku-muted)",
                border: "1px solid var(--kioku-border)",
              }}
            >
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        className="shrink-0 px-3 py-3"
        style={{ borderTop: "1px solid var(--kioku-border)" }}
      >
        <div className="flex items-center gap-2">
          {/* Camera button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--kioku-muted)" }}
            title="Camera"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />

          {/* Mic button */}
          <button
            type="button"
            onClick={toggleRecording}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{
              color: isRecording ? "var(--kioku-accent)" : "var(--kioku-muted)",
            }}
            title={isRecording ? "Stop recording" : "Voice memo"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isRecording ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          {/* File button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--kioku-muted)" }}
            title="Upload file"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me something..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm py-2 px-1 outline-none placeholder:opacity-40"
            style={{
              color: "var(--kioku-text)",
              borderBottom: "1px solid var(--kioku-border)",
            }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all disabled:opacity-25"
            style={{ color: "var(--kioku-accent)" }}
            title="Send"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
