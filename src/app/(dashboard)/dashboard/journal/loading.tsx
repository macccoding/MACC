export default function JournalLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-32 bg-sumi-gray/10 rounded-lg animate-pulse" />
        <div className="h-4 w-52 bg-sumi-gray/8 rounded mt-2 animate-pulse" />
      </div>

      {/* Textarea skeleton */}
      <div className="h-[300px] bg-sumi-gray/6 rounded-xl animate-pulse" />

      {/* Prompt chips skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 rounded-full bg-sumi-gray/8 animate-pulse"
            style={{ width: `${100 + i * 30}px` }}
          />
        ))}
      </div>

      {/* Previous entries skeleton */}
      <div className="border-t border-sumi-gray/20 pt-6 space-y-2">
        <div className="h-3 w-32 bg-sumi-gray/10 rounded mb-4 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
          >
            <div className="flex items-start gap-4">
              <div className="h-3 w-16 bg-sumi-gray/10 rounded shrink-0 animate-pulse" />
              <div className="h-4 w-full bg-sumi-gray/8 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
