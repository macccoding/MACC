"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Interaction = {
  id: string;
  date: string;
  notes: string;
  createdAt: string;
};

type Contact = {
  id: string;
  name: string;
  context: string;
  lastInteraction: string | null;
  createdAt: string;
  interactions: Interaction[];
};

const ease = [0.22, 1, 0.36, 1];

export default function PeoplePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newContext, setNewContext] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [interactionInputs, setInteractionInputs] = useState<
    Record<string, string>
  >({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchContacts = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const url = query
        ? `/api/contacts?search=${encodeURIComponent(query)}`
        : "/api/contacts";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchContacts(value);
    }, 300);
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          ...(newContext.trim() ? { context: newContext.trim() } : {}),
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewContext("");
        fetchContacts(search);
      }
    } catch (err) {
      console.error("Failed to add contact:", err);
    }
  }

  async function deleteContact(id: string) {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) fetchContacts(search);
    } catch (err) {
      console.error("Failed to delete contact:", err);
    }
  }

  async function addInteraction(contactId: string) {
    const notes = interactionInputs[contactId]?.trim();
    if (!notes) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setInteractionInputs((prev) => ({ ...prev, [contactId]: "" }));
        fetchContacts(search);
      }
    } catch (err) {
      console.error("Failed to add interaction:", err);
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function daysSince(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const then = new Date(dateStr).getTime();
    const now = Date.now();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
  }

  function daysSinceColor(days: number | null): string {
    if (days === null) return "text-red-400";
    if (days < 7) return "text-green-400";
    if (days < 30) return "text-amber-400";
    return "text-red-400";
  }

  function daysSinceLabel(days: number | null): string {
    if (days === null) return "Never contacted";
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatShortDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1
          className="text-parchment font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          People
        </h1>
        <p className="text-parchment-dim text-sm mt-1">
          Your relationships and interactions.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search contacts..."
          className="w-full bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl px-4 py-2.5 text-parchment placeholder:text-parchment-dim/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
      </motion.div>

      {/* Add Contact Form */}
      <motion.form
        onSubmit={addContact}
        className="flex gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name..."
          className="flex-1 bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl px-4 py-2.5 text-parchment placeholder:text-parchment-dim/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <input
          type="text"
          value={newContext}
          onChange={(e) => setNewContext(e.target.value)}
          placeholder="Context (optional)..."
          className="w-48 bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl px-4 py-2.5 text-parchment placeholder:text-parchment-dim/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300"
          style={{ fontSize: "var(--text-body)" }}
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Add
        </button>
      </motion.form>

      {/* Contacts List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-parchment-dim text-sm py-8 text-center"
            >
              Loading...
            </motion.div>
          ) : contacts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-parchment-dim text-sm py-8 text-center"
            >
              {search ? "No contacts match your search." : "No contacts yet."}
            </motion.div>
          ) : (
            contacts.map((contact, i) => {
              const days = daysSince(contact.lastInteraction);
              const isExpanded = expandedIds.has(contact.id);

              return (
                <motion.div
                  key={contact.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  transition={{
                    delay: i * 0.04,
                    duration: 0.4,
                    ease,
                  }}
                  className="group bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl p-4 hover:border-sumi-gray-dark/25 transition-colors duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      <h3 className="text-parchment font-medium text-lg">
                        {contact.name}
                      </h3>

                      {/* Context */}
                      {contact.context && (
                        <p className="text-parchment-dim text-sm mt-0.5 leading-relaxed">
                          {contact.context}
                        </p>
                      )}

                      {/* Last Interaction Indicator */}
                      <div className="flex items-center gap-4 mt-2">
                        <span
                          className={`font-mono tracking-[0.08em] ${daysSinceColor(days)}`}
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          {daysSinceLabel(days)}
                        </span>
                        {contact.lastInteraction && (
                          <span
                            className="font-mono tracking-[0.08em] text-parchment-muted"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            Last: {formatDate(contact.lastInteraction)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-parchment-dim hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
                        title="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  </div>

                  {/* Interactions Section */}
                  <div className="mt-3 pt-3 border-t border-sumi-gray-dark/8">
                    <button
                      onClick={() => toggleExpanded(contact.id)}
                      className="font-mono tracking-[0.12em] uppercase text-parchment-dim hover:text-parchment-muted transition-colors duration-200"
                      style={{ fontSize: "var(--text-micro)" }}
                    >
                      Interactions ({contact.interactions.length}){" "}
                      {isExpanded ? "\u25B4" : "\u25BE"}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease }}
                          className="overflow-hidden"
                        >
                          {/* Existing Interactions */}
                          {contact.interactions.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {contact.interactions.map((interaction) => (
                                <div
                                  key={interaction.id}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <span
                                    className="text-parchment-muted font-mono shrink-0"
                                    style={{ fontSize: "var(--text-micro)" }}
                                  >
                                    {formatShortDate(interaction.date)}
                                  </span>
                                  <span className="text-parchment-dim leading-relaxed">
                                    {interaction.notes}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Interaction Input */}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={interactionInputs[contact.id] || ""}
                              onChange={(e) =>
                                setInteractionInputs((prev) => ({
                                  ...prev,
                                  [contact.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addInteraction(contact.id);
                                }
                              }}
                              placeholder="Log an interaction..."
                              className="flex-1 bg-ink-dark/30 border border-sumi-gray-dark/8 rounded-lg px-3 py-1.5 text-parchment text-sm placeholder:text-parchment-dim/40 focus:outline-none focus:border-vermillion/20 transition-colors duration-300"
                            />
                            <button
                              onClick={() => addInteraction(contact.id)}
                              disabled={!interactionInputs[contact.id]?.trim()}
                              className="bg-vermillion/10 border border-vermillion/15 text-vermillion rounded-lg px-3 py-1.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/20 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{ fontSize: "var(--text-micro)" }}
                            >
                              Log
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
