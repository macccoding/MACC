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
  email: string | null;
  phone: string | null;
  company: string | null;
  relationship: string | null;
  birthday: string | null;
  importance: string | null;
  contactFrequency: string | null;
  nextReachOut: string | null;
  lastInteraction: string | null;
  createdAt: string;
  interactions: Interaction[];
};

type ContactFormData = {
  name: string;
  context: string;
  email: string;
  phone: string;
  company: string;
  relationship: string;
  birthday: string;
  importance: string;
  contactFrequency: string;
};

const emptyForm: ContactFormData = {
  name: "",
  context: "",
  email: "",
  phone: "",
  company: "",
  relationship: "",
  birthday: "",
  importance: "",
  contactFrequency: "",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const inputClass =
  "w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black placeholder:text-sumi-gray-light/50 focus:outline-none focus:border-vermillion/30 transition-colors duration-300";
const selectClass =
  "w-full bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl px-4 py-2.5 text-ink-black focus:outline-none focus:border-vermillion/30 transition-colors duration-300 appearance-none";

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getBirthdayThisYear(birthdayStr: string): Date {
  const bday = new Date(birthdayStr);
  const today = new Date();
  const thisYear = new Date(
    today.getFullYear(),
    bday.getMonth(),
    bday.getDate()
  );
  // If birthday already passed this year, check next year
  if (thisYear < today) {
    thisYear.setFullYear(today.getFullYear() + 1);
  }
  return thisYear;
}

function daysUntilBirthday(birthdayStr: string): number {
  const thisYear = getBirthdayThisYear(birthdayStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  thisYear.setHours(0, 0, 0, 0);
  return Math.floor(
    (thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function importanceColor(imp: string | null): string {
  switch (imp) {
    case "high":
      return "bg-vermillion";
    case "medium":
      return "bg-gold-seal";
    case "low":
      return "bg-sumi-gray";
    default:
      return "bg-transparent";
  }
}

function frequencyLabel(freq: string | null): string | null {
  switch (freq) {
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Biweekly";
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    default:
      return null;
  }
}

export default function PeoplePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [interactionInputs, setInteractionInputs] = useState<
    Record<string, string>
  >({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<ContactFormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ContactFormData>({ ...emptyForm });
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
    if (!addForm.name.trim()) return;

    try {
      const payload: Record<string, string> = {
        name: addForm.name.trim(),
      };
      if (addForm.context.trim()) payload.context = addForm.context.trim();
      if (addForm.email.trim()) payload.email = addForm.email.trim();
      if (addForm.phone.trim()) payload.phone = addForm.phone.trim();
      if (addForm.company.trim()) payload.company = addForm.company.trim();
      if (addForm.relationship.trim())
        payload.relationship = addForm.relationship.trim();
      if (addForm.birthday) payload.birthday = addForm.birthday;
      if (addForm.importance) payload.importance = addForm.importance;
      if (addForm.contactFrequency)
        payload.contactFrequency = addForm.contactFrequency;

      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setAddForm({ ...emptyForm });
        setShowAddForm(false);
        fetchContacts(search);
      }
    } catch (err) {
      console.error("Failed to add contact:", err);
    }
  }

  async function updateContact(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.name.trim()) return;

    try {
      const payload: Record<string, string | null> = {
        name: editForm.name.trim(),
        context: editForm.context.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
        company: editForm.company.trim() || null,
        relationship: editForm.relationship.trim() || null,
        birthday: editForm.birthday || null,
        importance: editForm.importance || null,
        contactFrequency: editForm.contactFrequency || null,
      };

      const res = await fetch(`/api/contacts/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditingId(null);
        fetchContacts(search);
      }
    } catch (err) {
      console.error("Failed to update contact:", err);
    }
  }

  function startEditing(contact: Contact) {
    setEditingId(contact.id);
    setEditForm({
      name: contact.name,
      context: contact.context || "",
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      relationship: contact.relationship || "",
      birthday: contact.birthday
        ? new Date(contact.birthday).toISOString().split("T")[0]
        : "",
      importance: contact.importance || "",
      contactFrequency: contact.contactFrequency || "",
    });
  }

  async function deleteContact(id: string) {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) fetchContacts(search);
    } catch (err) {
      console.error("Failed to delete contact:", err);
    }
  }

  async function addInteraction(contactId: string, notes?: string) {
    const text = notes || interactionInputs[contactId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: text }),
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

  // -- Derived data --

  const upcomingBirthdays = contacts.filter((c) => {
    if (!c.birthday) return false;
    const days = daysUntilBirthday(c.birthday);
    return days >= 0 && days <= 7;
  });

  const overdueReachouts = contacts
    .filter((c) => {
      if (!c.nextReachOut) return false;
      const d = daysUntil(c.nextReachOut);
      return d !== null && d < 0;
    })
    .sort((a, b) => {
      return (
        new Date(a.nextReachOut!).getTime() -
        new Date(b.nextReachOut!).getTime()
      );
    });

  const upcomingReachouts = contacts
    .filter((c) => {
      if (!c.nextReachOut) return false;
      const d = daysUntil(c.nextReachOut);
      return d !== null && d >= 0 && d <= 14;
    })
    .sort((a, b) => {
      return (
        new Date(a.nextReachOut!).getTime() -
        new Date(b.nextReachOut!).getTime()
      );
    });

  // -- Form component --
  function renderContactForm(
    form: ContactFormData,
    setForm: (f: ContactFormData) => void,
    onSubmit: (e: React.FormEvent) => void,
    submitLabel: string,
    onCancel?: () => void
  ) {
    return (
      <form onSubmit={onSubmit} className="space-y-3">
        {/* Row 1: Name + Context */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name *"
            required
            className={inputClass}
            style={{ fontSize: "var(--text-body)" }}
          />
          <input
            type="text"
            value={form.context}
            onChange={(e) => setForm({ ...form, context: e.target.value })}
            placeholder="Context (e.g., met at...)"
            className={inputClass}
            style={{ fontSize: "var(--text-body)" }}
          />
        </div>

        {/* Row 2: Email, Phone, Company */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className={inputClass}
            style={{ fontSize: "var(--text-body)" }}
          />
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone"
            className={inputClass}
            style={{ fontSize: "var(--text-body)" }}
          />
          <input
            type="text"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Company"
            className={inputClass}
            style={{ fontSize: "var(--text-body)" }}
          />
        </div>

        {/* Row 3: Relationship, Birthday */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            placeholder="Relationship (e.g., friend, colleague)"
            className={inputClass}
            style={{ fontSize: "var(--text-body)" }}
          />
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            className={inputClass}
            style={{ fontSize: "var(--text-body)" }}
          />
        </div>

        {/* Row 4: Importance, Frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={form.importance}
            onChange={(e) => setForm({ ...form, importance: e.target.value })}
            className={selectClass}
            style={{ fontSize: "var(--text-body)" }}
          >
            <option value="">Importance...</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={form.contactFrequency}
            onChange={(e) =>
              setForm({ ...form, contactFrequency: e.target.value })
            }
            className={selectClass}
            style={{ fontSize: "var(--text-body)" }}
          >
            <option value="">Contact Frequency...</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!form.name.trim()}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontSize: "var(--text-micro)" }}
          >
            {submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="border border-sumi-gray/20 text-sumi-gray rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-sumi-gray/10 transition-all duration-300"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
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
          className="text-ink-black font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          People
        </h1>
        <p className="text-sumi-gray-light text-sm mt-1">
          Your relationships and interactions.
        </p>
      </motion.div>

      {/* Birthday Alert Banner */}
      <AnimatePresence>
        {upcomingBirthdays.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease }}
            className="bg-vermillion/8 border border-vermillion/20 rounded-xl p-4"
          >
            <h2
              className="font-mono tracking-[0.12em] uppercase text-vermillion mb-2"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Upcoming Birthdays
            </h2>
            <div className="space-y-1">
              {upcomingBirthdays.map((c) => {
                const days = daysUntilBirthday(c.birthday!);
                const bdayDate = getBirthdayThisYear(c.birthday!);
                return (
                  <p key={c.id} className="text-sm text-ink-black">
                    {"🎂 "}
                    <span className="font-medium">{c.name}</span>
                    {days === 0
                      ? "'s birthday is today!"
                      : days === 1
                        ? "'s birthday is tomorrow"
                        : `'s birthday is ${bdayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} (${days} days)`}
                  </p>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overdue Reachouts */}
      <AnimatePresence>
        {overdueReachouts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease }}
            className="bg-vermillion/8 border border-vermillion/20 rounded-xl p-4"
          >
            <h2
              className="font-mono tracking-[0.12em] uppercase text-vermillion mb-3"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Overdue Reachouts
            </h2>
            <div className="space-y-2">
              {overdueReachouts.map((c) => {
                const overdueDays = Math.abs(daysUntil(c.nextReachOut)!);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-ink-black font-medium truncate">
                        {c.name}
                      </span>
                      <span
                        className="font-mono tracking-[0.08em] text-vermillion/70 shrink-0"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {overdueDays === 1
                          ? "1 day overdue"
                          : `${overdueDays} days overdue`}
                      </span>
                    </div>
                    <button
                      onClick={() => addInteraction(c.id, "Reached out")}
                      className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-lg px-3 py-1.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 transition-all duration-300 shrink-0"
                      style={{ fontSize: "var(--text-micro)" }}
                    >
                      Reached Out
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Reachouts */}
      <AnimatePresence>
        {upcomingReachouts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease }}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
          >
            <h2
              className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mb-3"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Upcoming Reachouts
            </h2>
            <div className="space-y-2">
              {upcomingReachouts.map((c) => {
                const daysLeft = daysUntil(c.nextReachOut)!;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-ink-black font-medium truncate">
                        {c.name}
                      </span>
                      <span
                        className="font-mono tracking-[0.08em] text-sumi-gray-light shrink-0"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        {daysLeft === 0
                          ? "Today"
                          : daysLeft === 1
                            ? "Tomorrow"
                            : `In ${daysLeft} days`}
                      </span>
                    </div>
                    <button
                      onClick={() => addInteraction(c.id, "Reached out")}
                      className="border border-sumi-gray/20 text-sumi-gray rounded-lg px-3 py-1.5 font-mono tracking-[0.12em] uppercase hover:bg-sumi-gray/10 transition-all duration-300 shrink-0"
                      style={{ fontSize: "var(--text-micro)" }}
                    >
                      Reached Out
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          className={`w-full ${inputClass}`}
          style={{ fontSize: "var(--text-body)" }}
        />
      </motion.div>

      {/* Add Contact Toggle + Form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
      >
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-5 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
            style={{ fontSize: "var(--text-micro)" }}
          >
            + Add Contact
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
          >
            <h2
              className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mb-3"
              style={{ fontSize: "var(--text-micro)" }}
            >
              New Contact
            </h2>
            {renderContactForm(
              addForm,
              setAddForm,
              addContact,
              "Add Contact",
              () => {
                setShowAddForm(false);
                setAddForm({ ...emptyForm });
              }
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Contacts List */}
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
          ) : contacts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sumi-gray-light text-sm py-8 text-center"
            >
              {search ? "No contacts match your search." : "No contacts yet."}
            </motion.div>
          ) : (
            contacts.map((contact, i) => {
              const days = daysSince(contact.lastInteraction);
              const isExpanded = expandedIds.has(contact.id);
              const isEditing = editingId === contact.id;
              const freqLabel = frequencyLabel(contact.contactFrequency);

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
                  className="group bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4 hover:border-sumi-gray/20 transition-colors duration-300"
                >
                  {isEditing ? (
                    <div>
                      <h3
                        className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mb-3"
                        style={{ fontSize: "var(--text-micro)" }}
                      >
                        Edit Contact
                      </h3>
                      {renderContactForm(
                        editForm,
                        setEditForm,
                        updateContact,
                        "Save",
                        () => setEditingId(null)
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Name row with importance dot */}
                          <div className="flex items-center gap-2">
                            {contact.importance && (
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${importanceColor(contact.importance)}`}
                                title={`${contact.importance} importance`}
                              />
                            )}
                            <button
                              onClick={() => startEditing(contact)}
                              className="text-ink-black font-medium text-lg hover:text-vermillion transition-colors duration-200 text-left"
                            >
                              {contact.name}
                            </button>
                            {freqLabel && (
                              <span
                                className="font-mono tracking-[0.08em] text-sumi-gray-light bg-sumi-gray/10 rounded-md px-2 py-0.5 shrink-0"
                                style={{ fontSize: "var(--text-micro)" }}
                              >
                                {freqLabel}
                              </span>
                            )}
                          </div>

                          {/* Company / Relationship subtitle */}
                          {(contact.company || contact.relationship) && (
                            <p className="text-sumi-gray text-sm mt-0.5">
                              {[contact.company, contact.relationship]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}

                          {/* Context */}
                          {contact.context && (
                            <p className="text-sumi-gray-light text-sm mt-0.5 leading-relaxed">
                              {contact.context}
                            </p>
                          )}

                          {/* Contact info links */}
                          {(contact.email || contact.phone) && (
                            <div className="flex items-center gap-3 mt-1.5">
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-sm text-vermillion/70 hover:text-vermillion transition-colors duration-200 font-mono"
                                  style={{ fontSize: "var(--text-micro)" }}
                                >
                                  {contact.email}
                                </a>
                              )}
                              {contact.phone && (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="text-sm text-vermillion/70 hover:text-vermillion transition-colors duration-200 font-mono"
                                  style={{ fontSize: "var(--text-micro)" }}
                                >
                                  {contact.phone}
                                </a>
                              )}
                            </div>
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
                                className="font-mono tracking-[0.08em] text-sumi-gray"
                                style={{ fontSize: "var(--text-micro)" }}
                              >
                                Last: {formatDate(contact.lastInteraction)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                          <button
                            onClick={() => startEditing(contact)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light hover:text-vermillion hover:bg-vermillion/10 transition-colors duration-200"
                            title="Edit"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteContact(contact.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-sumi-gray-light hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
                            title="Delete"
                          >
                            &times;
                          </button>
                        </div>
                      </div>

                      {/* Interactions Section */}
                      <div className="mt-3 pt-3 border-t border-sumi-gray/20">
                        <button
                          onClick={() => toggleExpanded(contact.id)}
                          className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light hover:text-sumi-gray transition-colors duration-200"
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
                                        className="text-sumi-gray font-mono shrink-0"
                                        style={{
                                          fontSize: "var(--text-micro)",
                                        }}
                                      >
                                        {formatShortDate(interaction.date)}
                                      </span>
                                      <span className="text-sumi-gray-light leading-relaxed">
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
                                  className="flex-1 bg-parchment-warm/30 border border-sumi-gray/20 rounded-lg px-3 py-1.5 text-ink-black text-sm placeholder:text-sumi-gray-light/40 focus:outline-none focus:border-vermillion/20 transition-colors duration-300"
                                />
                                <button
                                  onClick={() => addInteraction(contact.id)}
                                  disabled={
                                    !interactionInputs[contact.id]?.trim()
                                  }
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
                    </>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
