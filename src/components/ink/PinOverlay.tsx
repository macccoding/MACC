"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

interface PinOverlayProps {
  onClose: () => void;
}

export function PinOverlay({ onClose }: PinOverlayProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  // Passkey state
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerDeviceName, setRegisterDeviceName] = useState("");

  // Try passkey auth on mount
  useEffect(() => {
    let cancelled = false;

    async function tryPasskey() {
      try {
        const optRes = await fetch("/api/auth/passkey/auth/options", {
          method: "POST",
        });
        if (!optRes.ok) return; // No passkeys registered — skip

        if (cancelled) return;
        setPasskeyAvailable(true);
        setPasskeyLoading(true);

        const options = await optRes.json();
        const credential = await startAuthentication({ optionsJSON: options });

        if (cancelled) return;

        const verifyRes = await fetch("/api/auth/passkey/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });

        if (verifyRes.ok) {
          router.push("/dashboard");
          return;
        }
      } catch {
        // User cancelled or biometric failed — fall through to PIN
      } finally {
        if (!cancelled) setPasskeyLoading(false);
      }
    }

    tryPasskey();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Focus first PIN input once passkey loading is done
  useEffect(() => {
    if (!passkeyLoading) {
      const t = setTimeout(() => inputsRef.current[0]?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [passkeyLoading]);

  const triggerPasskeyAuth = useCallback(async () => {
    setPasskeyLoading(true);
    try {
      const optRes = await fetch("/api/auth/passkey/auth/options", {
        method: "POST",
      });
      if (!optRes.ok) return;

      const options = await optRes.json();
      const credential = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/passkey/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      if (verifyRes.ok) {
        router.push("/dashboard");
      }
    } catch {
      // User cancelled — stay on PIN
    } finally {
      setPasskeyLoading(false);
    }
  }, [router]);

  const handleRegisterPasskey = useCallback(async () => {
    setPasskeyLoading(true);
    try {
      const optRes = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
      });
      if (!optRes.ok) throw new Error("Failed to get registration options");

      const options = await optRes.json();
      const credential = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential,
          deviceName: registerDeviceName || "Unknown device",
        }),
      });

      if (verifyRes.ok) {
        router.push("/dashboard");
      }
    } catch {
      // Registration failed or cancelled — redirect anyway since already authed
      router.push("/dashboard");
    } finally {
      setPasskeyLoading(false);
    }
  }, [router, registerDeviceName]);

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
          // Success — show passkey registration prompt instead of immediate redirect
          setShowRegister(true);
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

      // All 4 digits entered
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

          {/* Passkey registration prompt (after successful PIN) */}
          {showRegister ? (
            <motion.div
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p
                className="text-parchment/60 font-mono tracking-wider"
                style={{ fontSize: "var(--text-micro)" }}
              >
                register for Face ID?
              </p>

              <input
                type="text"
                placeholder="device name"
                value={registerDeviceName}
                onChange={(e) => setRegisterDeviceName(e.target.value)}
                className="w-48 px-3 py-2 bg-transparent border-b border-sumi-gray-dark text-parchment font-mono text-sm outline-none focus:border-parchment/30 transition-colors text-center"
              />

              <div className="flex gap-4 items-center">
                <button
                  onClick={handleRegisterPasskey}
                  disabled={passkeyLoading}
                  className="px-4 py-2 font-mono text-sm tracking-wider text-parchment/80 border border-parchment/20 rounded hover:border-parchment/40 transition-colors disabled:opacity-40"
                >
                  {passkeyLoading ? "..." : "register"}
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="font-mono text-sm tracking-wider text-parchment/40 hover:text-parchment/60 transition-colors"
                >
                  skip
                </button>
              </div>
            </motion.div>
          ) : (
            <>
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
                      disabled={checking || passkeyLoading}
                      className={`w-11 h-13 text-center text-lg font-mono bg-transparent border-b-2 text-parchment outline-none transition-all duration-300 ${
                        error
                          ? "border-vermillion"
                          : digit
                            ? "border-parchment/40"
                            : "border-sumi-gray-dark focus:border-parchment/30"
                      }`}
                      style={{ caretColor: "transparent" }}
                    />
                    {/* Active indicator dot */}
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

              {/* Face ID button */}
              {passkeyAvailable && !passkeyLoading && (
                <motion.button
                  onClick={triggerPasskeyAuth}
                  className="font-mono tracking-wider text-parchment/40 hover:text-parchment/60 transition-colors"
                  style={{ fontSize: "var(--text-micro)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  use Face ID
                </motion.button>
              )}

              {/* Passkey loading indicator */}
              {passkeyLoading && (
                <motion.p
                  className="text-parchment/30 font-mono tracking-wider"
                  style={{ fontSize: "var(--text-micro)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  authenticating...
                </motion.p>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
