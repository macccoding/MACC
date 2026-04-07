"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface PinOverlayProps {
  onClose: () => void;
}

export function PinOverlay({ onClose }: PinOverlayProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const checkPin = useCallback(
    async (fullPin: string) => {
      setChecking(true);
      try {
        const res = await fetch("/api/auth/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: fullPin }),
        });

        if (res.ok) {
          router.push("/dashboard");
        } else {
          setError(true);
          setPin(["", "", "", ""]);
          setTimeout(() => inputsRef.current[0]?.focus(), 300);
        }
      } catch {
        setError(true);
        setPin(["", "", "", ""]);
        setTimeout(() => inputsRef.current[0]?.focus(), 300);
      } finally {
        setChecking(false);
      }
    },
    [router]
  );

  const handleInput = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;

      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      setError(false);

      if (value && index < 3) {
        inputsRef.current[index + 1]?.focus();
      }

      if (value && index === 3 && newPin.every((d) => d !== "")) {
        checkPin(newPin.join(""));
      }
    },
    [pin, checkPin]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !pin[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [pin, onClose]
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9000] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Ink backdrop */}
        <motion.div
          className="absolute inset-0 bg-ink-deep/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center gap-10"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
        >
          {/* Seal */}
          <svg viewBox="0 0 56 56" className="w-14 h-14 text-vermillion/50">
            <rect
              x="4"
              y="4"
              width="48"
              height="48"
              rx="5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <text
              x="28"
              y="38"
              textAnchor="middle"
              fill="currentColor"
              fontSize="22"
              fontFamily="serif"
            >
              陳
            </text>
          </svg>

          {/* PIN inputs */}
          <div className="flex gap-5">
            {pin.map((digit, i) => (
              <motion.div key={i} className="relative">
                <input
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={checking}
                  className={`w-11 h-13 text-center text-lg font-mono bg-transparent border-b-2 text-parchment outline-none transition-all duration-300 ${
                    error
                      ? "border-vermillion"
                      : digit
                        ? "border-parchment/40"
                        : "border-sumi-gray-dark focus:border-parchment/30"
                  }`}
                  style={{ caretColor: "transparent" }}
                />
                {digit && (
                  <motion.div
                    className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-vermillion/60"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="text-vermillion/70 font-mono tracking-wider"
                style={{ fontSize: "var(--text-micro)" }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                incorrect
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
