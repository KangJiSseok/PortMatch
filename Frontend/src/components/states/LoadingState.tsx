type LoadingStateProps = {
  title?: string;
  description?: string;
};

export default function LoadingState({
  title = '불러오는 중',
  description = '추천 기업을 가져오고 있어요.',
}: LoadingStateProps) {
  return (
    <div className="rounded-[28px] border border-[#f0eee9] bg-white p-7">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1 w-6 rounded-full bg-[#d6d2c4]" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a3a3a3]">
          Loading
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-base font-bold text-[#1a1a1a]">{title}</p>
        <p className="text-[14.5px] leading-relaxed text-[#4a4a4a]">{description}</p>
      </div>

      {/* skeleton */}
      <div className="mt-6 grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[22px] border border-[#f0eee9] bg-[#fcfcfc] p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="h-4 w-40 rounded-full bg-[#f0eee9]" />
                <div className="mt-3 h-3 w-full max-w-[520px] rounded-full bg-[#f0eee9]" />
                <div className="mt-2 h-3 w-3/4 rounded-full bg-[#f0eee9]" />
              </div>
              <div className="hidden md:block">
                <div className="h-3 w-16 rounded-full bg-[#f0eee9]" />
                <div className="mt-2 h-6 w-12 rounded-full bg-[#f0eee9]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
