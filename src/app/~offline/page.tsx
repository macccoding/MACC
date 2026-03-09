"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl font-serif text-vermillion/30 mb-6">断</div>
        <h1
          className="text-ink-black font-light mb-3"
          style={{ fontSize: "var(--text-heading)" }}
        >
          You&apos;re offline
        </h1>
        <p className="text-sumi-gray-light text-sm leading-relaxed mb-8">
          It looks like you&apos;ve lost your connection. Reconnect to continue.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-vermillion/15 border border-vermillion/20 text-vermillion rounded-xl px-6 py-2.5 font-mono tracking-[0.12em] uppercase hover:bg-vermillion/25 hover:border-vermillion/40 transition-all duration-300"
          style={{ fontSize: "var(--text-micro)" }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
