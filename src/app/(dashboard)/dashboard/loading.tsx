export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Greeting skeleton */}
      <div>
        <div className="h-8 w-64 bg-sumi-gray/10 rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-sumi-gray/8 rounded mt-2 hidden md:block animate-pulse" />
      </div>

      {/* Mobile: App grid skeleton */}
      <div className="md:hidden grid grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 py-3">
            <div className="w-14 h-14 rounded-2xl bg-sumi-gray/10 animate-pulse" />
            <div className="h-3 w-10 bg-sumi-gray/8 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Desktop: Card skeleton */}
      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-parchment-warm/40 border border-sumi-gray/20 rounded-xl p-4"
          >
            <div className="h-3 w-16 bg-sumi-gray/10 rounded mb-3 animate-pulse" />
            <div className="h-4 w-full bg-sumi-gray/8 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
