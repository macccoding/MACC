"use client";

interface EntityFeedProps {
  created: string[];
  updated: string[];
  onNodeClick?: (name: string) => void;
}

export default function EntityFeed({ created, updated, onNodeClick }: EntityFeedProps) {
  if (created.length === 0 && updated.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-1.5">
      {created.map((name) => (
        <button
          key={`c-${name}`}
          onClick={() => onNodeClick?.(name)}
          className="text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer"
          style={{
            backgroundColor: "color-mix(in srgb, var(--kioku-accent) 15%, transparent)",
            color: "var(--kioku-accent)",
            border: "1px solid color-mix(in srgb, var(--kioku-accent) 25%, transparent)",
            textDecoration: "underline",
            textDecorationThickness: "1px",
            textUnderlineOffset: "2px",
            textDecorationColor: "color-mix(in srgb, var(--kioku-accent) 40%, transparent)",
          }}
        >
          {name}
        </button>
      ))}
      {updated.map((name) => (
        <button
          key={`u-${name}`}
          onClick={() => onNodeClick?.(name)}
          className="text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer"
          style={{
            backgroundColor: "color-mix(in srgb, var(--kioku-muted) 15%, transparent)",
            color: "var(--kioku-muted)",
            border: "1px solid color-mix(in srgb, var(--kioku-muted) 25%, transparent)",
            textDecoration: "underline",
            textDecorationThickness: "1px",
            textUnderlineOffset: "2px",
            textDecorationColor: "color-mix(in srgb, var(--kioku-muted) 40%, transparent)",
          }}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
