"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AgendaItem = {
  time: string | null;
  type: "birthday" | "reachout" | "goal" | "habit" | "health" | "event";
  title: string;
  module: string;
  done?: boolean;
  location?: string;
  endTime?: string | null;
};

type AgendaResponse = {
  date: string;
  items: AgendaItem[];
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

function formatDateParam(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

const DOT_COLORS: Record<string, string> = {
  event: "bg-vermillion",
  birthday: "bg-gold-seal",
  reachout: "bg-vermillion/60",
  goal: "bg-emerald",
  habit: "bg-ink-black",
  health: "bg-sumi-gray",
};

const DOT_LABELS: Record<string, string> = {
  event: "Event",
  birthday: "Birthday",
  reachout: "Reach Out",
  goal: "Goal Due",
  habit: "Habit",
  health: "Health",
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgenda = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/calendar?date=${formatDateParam(date)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAgenda(data);
      }
    } catch (err) {
      console.error("Failed to fetch agenda:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgenda(currentDate);
  }, [currentDate, fetchAgenda]);

  function goToPrevDay() {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  }

  function goToNextDay() {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const eventCount = agenda?.items.filter((i) => i.type === "event").length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-ink-black font-light"
              style={{ fontSize: "var(--text-heading)" }}
            >
              Calendar
            </h1>
            <p className="text-sumi-gray-light text-sm mt-1">
              Your daily agenda at a glance.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Date Navigation */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease }}
      >
        <button
          onClick={goToPrevDay}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-parchment-warm/40 border border-sumi-gray/20 text-sumi-gray hover:text-ink-black hover:border-sumi-gray/30 transition-all duration-300"
          aria-label="Previous day"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 12L6 8L10 4" />
          </svg>
        </button>

        <div className="flex-1 text-center">
          <p
            className="text-ink-black font-light"
            style={{ fontSize: "var(--text-body)" }}
          >
            {formatDateDisplay(currentDate)}
          </p>
          {isToday(currentDate) && (
            <p
              className="font-mono tracking-[0.12em] uppercase text-vermillion mt-0.5"
              style={{ fontSize: "var(--text-micro)" }}
            >
              Today
            </p>
          )}
        </div>

        <button
          onClick={goToNextDay}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-parchment-warm/40 border border-sumi-gray/20 text-sumi-gray hover:text-ink-black hover:border-sumi-gray/30 transition-all duration-300"
          aria-label="Next day"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4L10 8L6 12" />
          </svg>
        </button>

        {!isToday(currentDate) && (
          <button
            onClick={goToToday}
            className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-4 py-2 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Today
          </button>
        )}
      </motion.div>

      {/* Google Calendar Status */}
      <motion.div
        className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.5, ease }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-vermillion/10 flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-vermillion"
            >
              <rect x="2" y="3" width="14" height="13" rx="2" />
              <path d="M2 7H16" />
              <path d="M6 1V5" />
              <path d="M12 1V5" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-ink-black/80 text-sm font-light">
              Google Calendar
            </p>
            <p className="text-sumi-gray-light text-xs mt-0.5">
              {loading
                ? "Loading events..."
                : eventCount > 0
                  ? `${eventCount} event${eventCount !== 1 ? "s" : ""} today`
                  : "No events for this day"}
            </p>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
      </motion.div>

      {/* Agenda Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease }}
      >
        <h2
          className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light mb-4"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Agenda
        </h2>

        <AnimatePresence mode="wait">
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
          ) : !agenda || agenda.items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-8 text-center"
            >
              <p className="text-sumi-gray-light text-sm">
                Nothing on the agenda for this day.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Vertical line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-sumi-gray/15" />

              <div className="space-y-0">
                {agenda.items.map((item, i) => (
                  <motion.div
                    key={`${item.type}-${item.title}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: i * 0.05,
                      duration: 0.4,
                      ease,
                    }}
                    className="flex items-start gap-4 py-3 group"
                  >
                    {/* Dot */}
                    <div className="relative z-10 mt-0.5 shrink-0">
                      {item.type === "habit" && !item.done ? (
                        <div className="w-[22px] h-[22px] rounded-full border-2 border-ink-black bg-transparent" />
                      ) : (
                        <div
                          className={`w-[22px] h-[22px] rounded-full ${DOT_COLORS[item.type] ?? "bg-sumi-gray"}`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-px">
                      <div className="flex items-center gap-2">
                        <p
                          className="font-mono tracking-[0.12em] uppercase text-sumi-gray-light"
                          style={{ fontSize: "var(--text-micro)" }}
                        >
                          {DOT_LABELS[item.type] ?? item.type}
                        </p>
                        {item.time && (
                          <p
                            className="font-mono text-vermillion/70"
                            style={{ fontSize: "var(--text-micro)" }}
                          >
                            {item.time}
                            {item.endTime ? ` – ${item.endTime}` : ""}
                          </p>
                        )}
                      </div>
                      <p
                        className="text-ink-black font-light mt-0.5 leading-snug"
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {item.title}
                      </p>
                      {item.location && (
                        <p className="text-sumi-gray-light text-xs mt-0.5">
                          {item.location}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
