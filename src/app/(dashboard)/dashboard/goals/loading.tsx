export default function GoalsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-24 bg-sumi-gray/10 rounded-lg animate-pulse" />
        <div className="h-4 w-56 bg-sumi-gray/8 rounded mt-2 animate-pulse" />
      </div>

      {/* Add form skeleton */}
      <div className="flex gap-3">
        <div className="flex-1 h-11 bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl animate-pulse" />
        <div className="h-11 w-16 bg-sumi-gray/10 rounded-xl animate-pulse" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-2">
        {["Active", "Completed", "Paused"].map((label) => (
          <div
            key={label}
            className="h-8 w-20 bg-sumi-gray/8 rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Goal cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
          >
            <div className="h-5 w-48 bg-sumi-gray/10 rounded mb-2 animate-pulse" />
            <div className="h-4 w-full bg-sumi-gray/8 rounded animate-pulse" />
            <div className="h-3 w-28 bg-sumi-gray/8 rounded mt-3 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
