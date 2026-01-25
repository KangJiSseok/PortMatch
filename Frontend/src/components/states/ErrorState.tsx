type ErrorStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function ErrorState({
  title = '불러오지 못했어요',
  description = '잠시 후 다시 시도해 주세요.',
  actionLabel = '다시 시도',
  onAction,
}: ErrorStateProps) {
  return (
    <div className="rounded-[28px] border border-[#f0eee9] bg-white p-7">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1 w-6 rounded-full bg-[#d6d2c4]" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a3a3a3]">
          Error
        </span>
      </div>

      <p className="text-base font-bold text-[#1a1a1a]">{title}</p>
      <p className="mt-2 text-[14.5px] leading-relaxed text-[#4a4a4a]">{description}</p>

      {onAction && (
        <div className="mt-6">
          <button
            onClick={onAction}
            className="rounded-xl border border-[#f0eee9] bg-[#fcfcfc] px-4 py-2 text-[12px] font-bold text-[#1a1a1a] transition-colors hover:bg-[#f0eee9]"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
