"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type EmailItem = {
  id: string;
  gmailId: string;
  subject: string;
  sender: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  category: string;
  summary: string;
};

type CategoryFilter =
  | "all"
  | "important"
  | "action_needed"
  | "fyi"
  | "newsletter"
  | "receipt";

const CATEGORY_FILTERS: { label: string; value: CategoryFilter }[] = [
  { label: "All", value: "all" },
  { label: "Important", value: "important" },
  { label: "Action", value: "action_needed" },
  { label: "FYI", value: "fyi" },
  { label: "Newsletter", value: "newsletter" },
  { label: "Receipt", value: "receipt" },
];

const CATEGORY_COLORS: Record<string, string> = {
  important: "text-red-400 bg-red-400/10",
  action_needed: "text-amber-400 bg-amber-400/10",
  fyi: "text-blue-400 bg-blue-400/10",
  newsletter: "text-green-400 bg-green-400/10",
  receipt: "text-purple-400 bg-purple-400/10",
  spam: "text-neutral-400 bg-neutral-400/10",
};

const CATEGORY_LABELS: Record<string, string> = {
  important: "Important",
  action_needed: "Action",
  fyi: "FYI",
  newsletter: "Newsletter",
  receipt: "Receipt",
  spam: "Spam",
};

function extractSenderName(sender: string): string {
  const match = sender.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  const emailMatch = sender.match(/^([^@]+)@/);
  if (emailMatch) return emailMatch[1];
  return sender;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default function EmailPage() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [digest, setDigest] = useState<string | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestOpen, setDigestOpen] = useState(true);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("category", filter);
      const res = await fetch(`/api/email?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchDigest = useCallback(async () => {
    setDigestLoading(true);
    try {
      const res = await fetch("/api/email/digest");
      if (res.ok) {
        const data = await res.json();
        setDigest(data.digest);
      }
    } catch (err) {
      console.error("Failed to fetch digest:", err);
    } finally {
      setDigestLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/email/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLastSynced(new Date().toLocaleTimeString());
        if (data.newEmails > 0) {
          fetchEmails();
          fetchDigest();
        }
      }
    } catch (err) {
      console.error("Failed to sync emails:", err);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1
            className="text-ink-black font-light"
            style={{ fontSize: "var(--text-heading)" }}
          >
            Email
          </h1>
          <p className="text-sumi-gray-light text-sm mt-1">
            Inbox triage with AI categorization.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lastSynced && (
            <span
              className="text-sumi-gray-light"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Synced {lastSynced}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-4 py-2 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ fontSize: "var(--text-micro)" }}
          >
            <span
              className={`inline-block ${syncing ? "animate-spin" : ""}`}
            >
              {"\u21BB"}
            </span>
            {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </motion.div>

      {/* AI Digest */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl overflow-hidden"
      >
        <button
          onClick={() => setDigestOpen(!digestOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{"\u2728"}</span>
            <span
              className="font-mono tracking-[0.12em] uppercase text-ink-black"
              style={{ fontSize: "var(--text-micro)" }}
            >
              AI Digest
            </span>
          </div>
          <span
            className="text-sumi-gray-light text-sm transition-transform duration-200"
            style={{
              transform: digestOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            {"\u25BE"}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {digestOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 border-t border-sumi-gray/10">
                {digestLoading ? (
                  <p className="text-sumi-gray-light text-sm pt-3 animate-pulse">
                    Generating digest...
                  </p>
                ) : digest ? (
                  <div
                    className="text-sumi-gray text-sm pt-3 leading-relaxed whitespace-pre-line"
                    style={{ fontSize: "var(--text-body)" }}
                  >
                    {digest}
                  </div>
                ) : (
                  <p className="text-sumi-gray-light text-sm pt-3">
                    No digest available. Sync emails to generate one.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Category Filter Pills */}
      <motion.div
        className="flex gap-2 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`font-mono tracking-[0.12em] uppercase px-4 py-1.5 rounded-full border transition-all duration-300 ${
              filter === f.value
                ? "bg-vermillion/15 border-vermillion/30 text-vermillion"
                : "bg-parchment-warm/20 border-sumi-gray/20 text-sumi-gray-light hover:border-sumi-gray/20 hover:text-sumi-gray"
            }`}
            style={{ fontSize: "var(--text-micro)" }}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Email Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              Loading...
            </motion.div>
          ) : emails.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              {filter === "all"
                ? "No emails yet. Hit Sync to pull from Gmail."
                : `No ${CATEGORY_LABELS[filter]?.toLowerCase() || filter} emails.`}
            </motion.div>
          ) : (
            emails.map((email, i) => (
              <motion.div
                key={email.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{
                  delay: i * 0.03,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`group bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/30 transition-colors duration-300 ${
                  !email.isRead ? "border-l-2 border-l-vermillion/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Sender + Category + Time */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`font-medium ${
                          !email.isRead ? "text-ink-black" : "text-sumi-gray"
                        }`}
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {extractSenderName(email.sender)}
                      </span>
                      {email.category && email.category !== "fyi" && (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full font-mono tracking-[0.08em] uppercase shrink-0 ${
                            CATEGORY_COLORS[email.category] ||
                            CATEGORY_COLORS.fyi
                          }`}
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          {CATEGORY_LABELS[email.category] || email.category}
                        </span>
                      )}
                      {email.isStarred && (
                        <span className="text-amber-400 text-sm shrink-0">
                          {"\u2605"}
                        </span>
                      )}
                      <span
                        className="text-sumi-gray-light ml-auto shrink-0"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {timeAgo(email.date)}
                      </span>
                    </div>

                    {/* Subject */}
                    <h3
                      className={`mt-1 leading-snug truncate ${
                        !email.isRead ? "text-ink-black" : "text-sumi-gray"
                      }`}
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      {email.subject || "(no subject)"}
                    </h3>

                    {/* Summary or Snippet */}
                    <p
                      className="text-sumi-gray-light mt-1 leading-relaxed line-clamp-2"
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      {email.summary || email.snippet}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
