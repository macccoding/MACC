export type CommandType = "navigation" | "action" | "kemi";

export interface Command {
  id: string;
  label: string;
  type: CommandType;
  icon?: string;
  description?: string;
  /** For navigation commands */
  href?: string;
  /** For action commands — Kemi tool to invoke */
  kemiAction?: string;
  /** Keywords for fuzzy search beyond the label */
  keywords?: string[];
}

const NAVIGATION_COMMANDS: Command[] = [
  { id: "nav-home", label: "Home", type: "navigation", icon: "家", href: "/dashboard" },
  { id: "nav-finances", label: "Finances", type: "navigation", icon: "金", href: "/dashboard/finances", keywords: ["money", "transactions", "spending"] },
  { id: "nav-budget", label: "Budget", type: "navigation", icon: "算", href: "/dashboard/budget", keywords: ["allocations", "score", "recurring"] },
  { id: "nav-email", label: "Email", type: "navigation", icon: "信", href: "/dashboard/email", keywords: ["gmail", "inbox", "messages"] },
  { id: "nav-calendar", label: "Calendar", type: "navigation", icon: "暦", href: "/dashboard/calendar", keywords: ["schedule", "events", "meetings"] },
  { id: "nav-goals", label: "Goals", type: "navigation", icon: "的", href: "/dashboard/goals", keywords: ["objectives", "targets"] },
  { id: "nav-habits", label: "Habits", type: "navigation", icon: "習", href: "/dashboard/habits", keywords: ["routines", "streaks", "daily"] },
  { id: "nav-health", label: "Health", type: "navigation", icon: "体", href: "/dashboard/health", keywords: ["sleep", "steps", "exercise", "heart"] },
  { id: "nav-learning", label: "Learning", type: "navigation", icon: "学", href: "/dashboard/learning", keywords: ["courses", "tracks", "study"] },
  { id: "nav-journal", label: "Journal", type: "navigation", icon: "記", href: "/dashboard/journal", keywords: ["diary", "entries", "reflection"] },
  { id: "nav-investments", label: "Investments", type: "navigation", icon: "株", href: "/dashboard/investments", keywords: ["stocks", "portfolio", "crypto"] },
  { id: "nav-travel", label: "Travel", type: "navigation", icon: "旅", href: "/dashboard/travel", keywords: ["trips", "flights"] },
  { id: "nav-creative", label: "Creative", type: "navigation", icon: "芸", href: "/dashboard/creative", keywords: ["projects", "ideas"] },
  { id: "nav-reading", label: "Reading", type: "navigation", icon: "読", href: "/dashboard/reading", keywords: ["books", "articles", "audiobooks"] },
  { id: "nav-people", label: "People", type: "navigation", icon: "人", href: "/dashboard/people", keywords: ["contacts", "crm", "relationships"] },
  { id: "nav-knowledge", label: "Knowledge", type: "navigation", icon: "脳", href: "/dashboard/knowledge", keywords: ["kioku", "graph", "notes"] },
  { id: "nav-blueprint", label: "Blueprint", type: "navigation", icon: "図", href: "/dashboard/blueprint", keywords: ["strategy", "life design"] },
];

const ACTION_COMMANDS: Command[] = [
  { id: "act-log-habit", label: "Log a habit", type: "action", icon: "✓", kemiAction: "log_habit", keywords: ["complete", "done", "check off"] },
  { id: "act-add-task", label: "Add a task", type: "action", icon: "+", kemiAction: "add_task", keywords: ["todo", "reminder", "create task"] },
  { id: "act-journal", label: "Write journal entry", type: "action", icon: "✎", kemiAction: "write_journal", keywords: ["capture", "thought", "reflect"] },
  { id: "act-log-expense", label: "Log expense", type: "action", icon: "$", kemiAction: "log_entry", keywords: ["spent", "payment", "cost"] },
  { id: "act-add-goal", label: "Add a goal", type: "action", icon: "◎", kemiAction: "add_goal", keywords: ["objective", "target"] },
  { id: "act-capture", label: "Quick capture", type: "action", icon: "⚡", keywords: ["thought", "idea", "note", "link"] },
];

export const ALL_COMMANDS: Command[] = [
  ...NAVIGATION_COMMANDS,
  ...ACTION_COMMANDS,
];
