interface InkSpillTransitionProps {
  /** "enter" = parchment->dark, "exit" = dark->parchment */
  direction: "enter" | "exit";
  className?: string;
  /** CSS height (default "80vh") */
  height?: string;
}

export function InkSpillTransition({
  direction,
  className = "",
  height = "80vh",
}: InkSpillTransitionProps) {
  const gradient =
    direction === "enter"
      ? "linear-gradient(to bottom, transparent 0%, var(--ink-deep) 100%)"
      : "linear-gradient(to bottom, var(--ink-deep) 0%, transparent 100%)";

  return (
    <div
      className={className}
      style={{ height, background: gradient }}
      aria-hidden="true"
    />
  );
}
