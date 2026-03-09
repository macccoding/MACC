export const JAMAICA_TZ = "America/Jamaica";

export function nowJamaica(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: JAMAICA_TZ }));
}

export function formatJamaicaTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: JAMAICA_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function todayJamaica(): Date {
  const now = nowJamaica();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function startOfWeek(): Date {
  const d = todayJamaica();
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return d;
}

export function truncateToolResult(content: string, max: number = 4000): string {
  if (content.length <= max) return content;
  return content.slice(0, max) + "\n...[truncated]";
}
