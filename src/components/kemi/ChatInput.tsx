"use client";

import { useState, useRef, useCallback } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex gap-2 items-end p-3 border-t border-sumi-gray-dark/15">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
        }}
        onKeyDown={handleKeyDown}
        placeholder="Talk to Kemi..."
        aria-label="Message to Kemi"
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-transparent text-parchment placeholder:text-sumi-gray text-[13px] outline-none py-2 px-1 font-serif"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        aria-label="Send message"
        className="shrink-0 w-7 h-7 rounded-full bg-vermillion/70 hover:bg-vermillion text-parchment flex items-center justify-center transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 12 12" className="w-3 h-3" fill="currentColor">
          <path d="M1.5 6L10.5 6M7 2.5L10.5 6L7 9.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
