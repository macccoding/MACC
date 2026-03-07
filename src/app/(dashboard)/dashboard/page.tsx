"use client";

import { motion } from "framer-motion";

const CARDS = [
  {
    title: "Calendar",
    content: "No events today",
    accent: false,
  },
  {
    title: "Kill / Live / Build",
    content: "$15K debt → $0 by July",
    accent: true,
  },
  {
    title: "Email",
    content: "3 unread, 1 flagged",
    accent: false,
  },
  {
    title: "Health",
    content: "7,234 steps · 6h 42m sleep",
    accent: false,
  },
  {
    title: "Streaks",
    content: "Spanish: 12 days · Gym: 4 days",
    accent: true,
  },
  {
    title: "Kemi says",
    content: '"You said you\'d review finances this week. That was 5 days ago."',
    accent: false,
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHome() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-parchment font-light"
          style={{ fontSize: "var(--text-heading)" }}
        >
          {getGreeting()}, <span className="text-vermillion">Mike</span>
        </h1>
        <p className="text-parchment-dim text-sm mt-1">
          Here&apos;s your day at a glance.
        </p>
      </motion.div>

      {/* Brief cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {CARDS.map((card, i) => (
          <motion.div
            key={card.title}
            className="bg-ink-dark/40 border border-sumi-gray-dark/12 rounded-xl p-4 hover:border-sumi-gray-dark/25 transition-colors duration-300"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 + i * 0.06,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p
              className={`font-mono tracking-[0.12em] uppercase mb-2.5 ${
                card.accent ? "text-vermillion/50" : "text-parchment-dim"
              }`}
              style={{ fontSize: "var(--text-micro)" }}
            >
              {card.title}
            </p>
            <p className="text-parchment/80 text-sm leading-relaxed">
              {card.content}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
