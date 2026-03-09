import { Markdown } from "@/components/ui/Markdown";

interface ChatMessageProps {
  role: "user" | "kemi";
  content: string;
  timestamp?: string;
  toolActivity?: string | null;
}

export function ChatMessage({ role, content, timestamp, toolActivity }: ChatMessageProps) {
  const isKemi = role === "kemi";

  return (
    <div className={`flex gap-2.5 ${isKemi ? "" : "flex-row-reverse"}`}>
      {isKemi && (
        <div className="w-6 h-6 rounded-full bg-vermillion/15 border border-vermillion/25 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-vermillion text-[10px] font-serif">K</span>
        </div>
      )}

      <div
        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
          isKemi
            ? "bg-ink-dark/70 text-parchment rounded-tl-sm"
            : "bg-vermillion/8 text-parchment rounded-tr-sm"
        }`}
      >
        {isKemi ? (
          <div className="kemi-message">
            <Markdown content={content} className="text-parchment" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
        {toolActivity && (
          <span className="block mt-1 text-[10px] text-vermillion/60 font-mono tracking-wide italic">
            {toolActivity}
          </span>
        )}
        {timestamp && (
          <span className="block mt-1.5 text-[9px] text-sumi-gray font-mono tracking-wider">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
