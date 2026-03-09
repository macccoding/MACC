export default function HabitsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-28 bg-sumi-gray/10 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-sumi-gray/8 rounded mt-2 animate-pulse" />
      </div>

      {/* Add form skeleton */}
      <div className="flex gap-3">
        <div className="flex-1 h-11 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl animate-pulse" />
        <div className="h-11 w-16 bg-sumi-gray/10 rounded-xl animate-pulse" />
      </div>

      {/* Habit cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-5 w-32 bg-sumi-gray/10 rounded animate-pulse" />
              <div className="h-3 w-16 bg-sumi-gray/8 rounded animate-pulse" />
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, j) => (
                <div
                  key={j}
                  className="w-9 h-9 rounded-lg bg-sumi-gray/8 animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
