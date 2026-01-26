// src/components/Calendar/CalendarSkeleton.tsx
export default function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_380px] gap-8">
      {/* ✅ Left: Calendar grid skeleton */}
      <div>
        <div className="grid grid-cols-7 gap-3 text-center text-sm font-black text-silver-mist">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-3">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[78px] animate-pulse rounded-2xl border border-zinc-100 bg-pure-white p-3"
            >
              <div className="h-4 w-8 rounded bg-cloud-dancer" />
              <div className="mt-3 h-3 w-20 rounded bg-cloud-dancer/80" />
              <div className="mt-2 h-3 w-16 rounded bg-cloud-dancer/60" />
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Right: Schedule panel skeleton (380px fixed) */}
      <div className="rounded-3xl border border-zinc-100 bg-pure-white p-5 shadow-sm">
        <div className="h-5 w-36 animate-pulse rounded bg-cloud-dancer" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-cloud-dancer/70" />

        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-zinc-100 bg-cloud-dancer/30 p-4"
            >
              <div className="h-4 w-4/5 rounded bg-cloud-dancer" />
              <div className="mt-2 h-3 w-1/2 rounded bg-cloud-dancer/80" />

              <div className="mt-4 flex justify-end">
                <div className="h-9 w-20 rounded-xl bg-cloud-dancer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
