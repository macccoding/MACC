"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SpeechRecognizer,
  isSpeechRecognitionSupported,
} from "@/lib/voice/speech-recognition";

type VoiceState = "idle" | "listening" | "processing";

interface VoiceButtonProps {
  /** Called with the final transcript when the user stops recording. */
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceButton({ onTranscript, className = "" }: VoiceButtonProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [supported, setSupported] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const transcriptRef = useRef("");

  // Check browser support on mount
  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognizerRef.current?.stop();
    };
  }, []);

  const handleClick = useCallback(() => {
    if (!supported) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2500);
      return;
    }

    // Toggle off — stop and submit
    if (state === "listening") {
      setState("processing");
      recognizerRef.current?.stop();
      return;
    }

    // Start listening
    transcriptRef.current = "";

    const recognizer = new SpeechRecognizer({
      onResult: (text, isFinal) => {
        if (isFinal) {
          transcriptRef.current = text;
        }
      },
      onError: (error) => {
        console.error("[VoiceButton] Speech error:", error);
        setState("idle");
      },
      onEnd: () => {
        const transcript = transcriptRef.current.trim();
        if (transcript) {
          onTranscript(transcript);
        }
        setState("idle");
      },
    });

    recognizerRef.current = recognizer;
    const started = recognizer.start();

    if (started) {
      setState("listening");
    } else {
      setSupported(false);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2500);
    }
  }, [state, supported, onTranscript]);

  const isListening = state === "listening";
  const isProcessing = state === "processing";

  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Pulsing ring behind the button when listening */}
      <AnimatePresence>
        {isListening && (
          <motion.span
            className="absolute inset-0 rounded-lg border-2 border-vermillion"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: [0.6, 0.2, 0.6],
              scale: [1, 1.25, 1],
            }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing}
        aria-label={
          isListening
            ? "Stop recording"
            : isProcessing
              ? "Processing voice"
              : "Start voice capture"
        }
        className={`
          relative z-10 flex items-center justify-center
          w-9 h-9 rounded-lg transition-colors
          ${
            isListening
              ? "bg-vermillion/15 text-vermillion"
              : "bg-parchment-warm/40 text-sumi-gray hover:text-ink-black hover:bg-parchment-warm/70"
          }
          ${isProcessing ? "opacity-50 cursor-wait" : ""}
          border border-sumi-gray/20
        `}
      >
        {isProcessing ? (
          /* Spinner */
          <svg
            className="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="50 20"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          /* Microphone icon */
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="17" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        )}
      </button>

      {/* "Not supported" tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-ink-dark text-parchment text-xs font-mono whitespace-nowrap"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
          >
            Not supported in this browser
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
